package atomdance.app.modules.finance.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.discount.service.DiscountService;
import atomdance.app.modules.finance.dto.CreateCustomListRequest;
import atomdance.app.modules.finance.dto.PaymentListView;
import atomdance.app.modules.finance.model.*;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.finance.repository.TransactionRepository;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.instructor.service.InstructorService;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentListService {

	private final PaymentListRepository paymentListRepository;
	private final PaymentRepository paymentRepository;
	private final TransactionRepository transactionRepository;
	private final MembershipRepository membershipRepository;
	private final PersonRepository personRepository;
	private final DiscountService discountService;
	private final PaymentCalculator paymentCalculator;
	private final StandardListProvisioner standardListProvisioner;
	private final InstructorExpenseService instructorExpenseService;
	private final InstructorService instructorService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final MessageSource messageSource;
	private final AppClock clock;

	public PaymentList getOrThrow(UUID id) {
		return paymentListRepository.findByIdWithSource(id)
				.orElseThrow(() -> new NotFoundException("entity.list"));
	}

	@Transactional(readOnly = true)
	public Page<PaymentListView> list(ListType type, Integer year, Pageable pageable) {
		return paymentListRepository.search(type, year, pageable).map(PaymentListView::from);
	}

	@Transactional(readOnly = true)
	public PaymentListView get(UUID id) {
		auditLogger.record(currentUserOrSystem(), id, AuditEventType.LIST_PREVIEW, AuditOutcome.SUCCESS, "List previewed.");
		return PaymentListView.from(getOrThrow(id));
	}

	// ---------------------------------------------------------------- Standard Lists

	@Transactional
	public PaymentList ensureStandardList(YearMonth ym, ListType type) {
		requireStandardType(type);

		Optional<PaymentList> existing = paymentListRepository.findByYearAndMonthAndType(ym.getYear(), ym.getMonthValue(), type);

		if (existing.isPresent()) {
			return existing.get();
		}

		PaymentList created;

		try {
			created = standardListProvisioner.insert(ym, type);
		} catch (DataIntegrityViolationException e) {
			log.debug("The {} list for {} was created concurrently; using the existing one", type, ym);

			return paymentListRepository.findByYearAndMonthAndType(ym.getYear(), ym.getMonthValue(), type)
					.orElseThrow(() -> new NotFoundException("entity.list"));
		}

		PaymentList list = paymentListRepository.findById(created.getId())
				.orElseThrow(() -> new NotFoundException("entity.list"));

		syncStandardPayments(list);

		if (list.carriesInstructorPay()) {
			instructorExpenseService.seed(list, instructorService.findActive());
		}

		log.info("Created {} list {} for {}", list.getType(), list.getId(), ym);
		auditLogger.recordOnCommit(null, list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Monthly list for %s has been created.", describe(list)));

		return list;
	}

	/**
	 * @param tournament which of the month's two sheets is wanted
	 * @param create     whether to bring it into being if it does not exist yet
	 */
	@Transactional
	public PaymentListView getStandard(int year, int month, boolean tournament, boolean create) {
		YearMonth yearMonth = YearMonth.of(year, month);
		ListType type = ListType.standardFor(tournament);

		if (create) {
			return PaymentListView.from(ensureStandardList(yearMonth, type));
		}

		return paymentListRepository.findByYearAndMonthAndType(year, month, type)
				.map(PaymentListView::from)
				.orElseThrow(() -> new NotFoundException("entity.list"));
	}

	// ---------------------------------------------------------------- custom lists

	/**
	 * Builds an ad-hoc list from one of the three ways a user picks who belongs on it.
	 */
	@Transactional
	public PaymentListView createCustom(CreateCustomListRequest request) {
		boolean camp = Boolean.TRUE.equals(request.campList());

		PaymentList list = paymentListRepository.saveAndFlush(PaymentList.builder()
				.type(camp ? ListType.CAMP : ListType.CUSTOM)
				.name(request.name().trim())
				.status(ListStatus.OPEN)
				.populationMode(request.populationMode())
				.sourceList(request.populationMode() == ListPopulationMode.FROM_UNPAID
						? getOrThrow(requireSourceList(request))
						: null)
				.note(request.note())
				.build());

		int added = populateCustom(list, request);

		log.info("Created {} list {} ({}) with {} person(s) via {}", list.getType(), list.getId(), list.getName(), added, request.populationMode());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s list '%s' has been created with %d person(s) via %s.", list.getType(), list.getName(), added, request.populationMode()));

		return PaymentListView.from(list);
	}

	/**
	 * Replays the choice that built a custom list, picking up people who have since come to qualify.
	 */
	@Transactional
	public PaymentListView repopulate(UUID id) {
		PaymentList list = getOrThrow(id);
		list.assertOpen();

		if (list.isStandard()) {
			throw new InvalidOperationException("error.cannot_repopulate_standard_list");
		}

		if (list.getPopulationMode() == null) {
			throw new InvalidOperationException("error.list_not_repopulatable");
		}

		int added = switch (list.getPopulationMode()) {
			case BY_GROUPS -> {
				if (list.getSourceGroupIds().isEmpty()) {
					throw new InvalidOperationException("error.list_population_requires_groups");
				}

				yield attachPersons(list, membershipRepository.findActivePersonIdsInGroups(list.getSourceGroupIds()));
			}

			case BY_PERSONS -> throw new InvalidOperationException("error.list_not_repopulatable");
			case FROM_UNPAID -> populateFromUnpaid(list, list.getSourceList() == null ? null : list.getSourceList().getId());
		};

		log.info("Repopulated list {} via {}, adding {} person(s)", list.getId(), list.getPopulationMode(), added);
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s repopulated, adding %d person(s).", describe(list), added));

		return PaymentListView.from(list);
	}

	/**
	 * Adds specific people to an existing open list.
	 */
	@Transactional
	public PaymentListView addPersons(UUID id, List<UUID> personIds) {
		PaymentList list = getOrThrow(id);
		list.assertOpen();

		int added = attachPersons(list, personIds);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%d person(s) added to list %s.", added, describe(list)));

		return PaymentListView.from(list);
	}

	// ---------------------------------------------------------------- recalculation

	/**
	 * Rebuilds every amount on an open list from the current memberships and discount configuration.
	 */
	@Transactional
	public PaymentListView recalculate(UUID id) {
		PaymentList list = getOrThrow(id);
		list.assertOpen();

		if (list.isStandard()) {
			syncStandardPayments(list);
		} else {
			for (Payment payment : paymentRepository.findByListIdWithLines(id)) {
				payment.recalculateAmountToPay();
			}
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s has been recalculated.", describe(list)));

		return PaymentListView.from(list);
	}

	// ---------------------------------------------------------------- closing

	/**
	 * Freezes the list for the accountants. Idempotent.
	 */
	@Transactional
	public PaymentListView close(UUID id) {
		PaymentList list = getOrThrow(id);

		if (list.isClosed()) {
			return PaymentListView.from(list);
		}

		list.setStatus(ListStatus.CLOSED);
		list.setClosedAt(Instant.now());
		list.setClosedByUserId(securityService.getCurrentUserId());

		log.info("Closed list {} ({})", list.getId(), describe(list));
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s has been closed and is now final.", describe(list)));

		return PaymentListView.from(list);
	}

	/**
	 * Unfreezes a list.
	 */
	@Transactional
	public PaymentListView reopen(UUID id) {
		PaymentList list = getOrThrow(id);

		if (!list.isClosed()) {
			return PaymentListView.from(list);
		}

		list.setStatus(ListStatus.OPEN);
		list.setClosedAt(null);
		list.setClosedByUserId(null);

		log.warn("Reopened list {} ({}) at the request of {} - it had already been sent to the accountants", list.getId(), describe(list), securityService.getCurrentUsername());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s has been reopened after being closed.", describe(list)));

		return PaymentListView.from(list);
	}

	/**
	 * Only for a list created by mistake: refused once it is closed or once any money has been recorded against it.
	 */
	@Transactional
	public void delete(UUID id) {
		//admin bypass needed
		PaymentList list = getOrThrow(id);
		list.assertOpen();

		boolean holdsMoney = paymentRepository.findByListIdWithLines(id).stream()
				.anyMatch(payment -> Money.isPositive(payment.getAmountPaid()));

		if (holdsMoney) {
			throw new InvalidOperationException("error.list_holds_money");
		}

		transactionRepository.deleteByListId(id);
		paymentRepository.deleteAll(paymentRepository.findByListIdWithLines(id));
		paymentListRepository.delete(list);

		log.info("Deleted list {} ({})", id, describe(list));
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), id, AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s has been deleted.", describe(list)));
	}

	// ---------------------------------------------------------------- population internals

	/**
	 * Brings a monthly list's people and amounts into line with the memberships that were running that month and belong on this sheet.
	 */
	private void syncStandardPayments(PaymentList list) {
		YearMonth month = list.yearMonth();

		if (month == null) {
			throw new InvalidOperationException("error.standard_list_requires_month");
		}

		List<Membership> monthMemberships = membershipRepository.findActiveDuring(month.atDay(1), month.atEndOfMonth(), true);
		List<Membership> billable = billableOn(list, monthMemberships);
		Map<UUID, Person> billablePersons = new LinkedHashMap<>();

		for (Membership membership : billable) {
			billablePersons.putIfAbsent(membership.getPerson().getId(), membership.getPerson());
		}

		List<Payment> payments = new ArrayList<>(paymentRepository.findByListIdWithLines(list.getId()));
		Set<UUID> alreadyOnList = new HashSet<>();

		for (Payment payment : payments) {
			alreadyOnList.add(payment.getPerson().getId());
		}

		for (Map.Entry<UUID, Person> entry : billablePersons.entrySet()) {
			if (!alreadyOnList.contains(entry.getKey())) {
				payments.add(paymentRepository.save(newPayment(list, entry.getValue())));
			}
		}

		payments.removeIf(payment -> dropIfNoLongerBillable(payment, billablePersons.keySet()));

		paymentCalculator.recalculate(payments, billable, monthMemberships, discountService.currentRules());
	}

	/**
	 * The memberships a sheet charges for: the tournament list carries the tournament groups and the regular
	 * list carries the rest.
	 */
	private static List<Membership> billableOn(PaymentList list, Collection<Membership> memberships) {
		return memberships.stream()
				.filter(membership -> membership.getGroup().isTournamentGroup() == list.isTournament())
				.toList();
	}

	private static void requireStandardType(ListType type) {
		if (type == null || !type.isStandard()) {
			throw new InvalidOperationException("error.not_a_standard_list_type");
		}
	}

	/**
	 * Removes somebody who no longer has a membership this month - but only when there is nothing on their
	 * row worth keeping.
	 *
	 * @return whether the payment was deleted
	 */
	private boolean dropIfNoLongerBillable(Payment payment, Set<UUID> billablePersonIds) {
		if (billablePersonIds.contains(payment.getPerson().getId())) {
			return false;
		}

		boolean worthKeeping = Money.isPositive(payment.getAmountPaid())
				|| payment.isFakePayment()
				|| payment.getLines().stream().anyMatch(line -> line.getKind() == PaymentLineKind.ONE_TIME);

		if (worthKeeping) {
			return false;
		}

		paymentRepository.delete(payment);

		return true;
	}

	private int populateCustom(PaymentList list, CreateCustomListRequest request) {
		return switch (request.populationMode()) {
			case BY_GROUPS -> {
				if (request.groupIds() == null || request.groupIds().isEmpty()) {
					throw new InvalidOperationException("error.list_population_requires_groups");
				}

				list.getSourceGroupIds().addAll(request.groupIds());

				yield attachPersons(list, membershipRepository.findActivePersonIdsInGroups(request.groupIds()));
			}
			case BY_PERSONS -> {
				if (request.personIds() == null || request.personIds().isEmpty()) {
					throw new InvalidOperationException("error.list_population_requires_persons");
				}

				yield attachPersons(list, request.personIds());
			}
			case FROM_UNPAID -> populateFromUnpaid(list, requireSourceList(request));
		};
	}

	/**
	 * Carries everybody still owing on another list over to this one, debt included.
	 */
	private int populateFromUnpaid(PaymentList list, UUID sourceListId) {
		if (sourceListId == null) {
			throw new InvalidOperationException("error.list_population_requires_source");
		}

		PaymentList source = getOrThrow(sourceListId);
		List<Payment> unpaid = paymentRepository.findUnpaidByListId(sourceListId);

		Set<UUID> alreadyOnList = new HashSet<>(paymentRepository.findPersonIdsByListId(list.getId()));
		int added = 0;

		for (Payment debt : unpaid) {
			if (alreadyOnList.contains(debt.getPerson().getId())) {
				continue;
			}

			Payment payment = paymentRepository.save(newPayment(list, debt.getPerson()));
			payment.addLine(carriedOverLine(debt.getOutstanding(), source));
			payment.recalculateAmountToPay();

			added++;
		}

		return added;
	}

	private PaymentLine carriedOverLine(BigDecimal outstanding, PaymentList source) {
		PaymentLine line = PaymentLine.builder()
				.kind(PaymentLineKind.ONE_TIME)
				.description(messageSource.getMessage(
						"list.carried_over_from",
						new Object[]{describe(source)},
						"Carried over from " + describe(source),
						LocaleContextHolder.getLocale()))
				.unitCost(Money.normalize(outstanding))
				.quantity(BigDecimal.ONE)
				.build();

		line.applyDiscount(Money.ZERO);

		return line;
	}

	/**
	 * Puts people on a list with nothing owed yet.
	 *
	 * @return how many people were added, skipping any already present
	 */
	private int attachPersons(PaymentList list, Collection<UUID> personIds) {
		List<UUID> distinct = personIds.stream().distinct().toList();
		List<Person> persons = personRepository.findAllByIdWithFamily(distinct);

		if (persons.size() != distinct.size()) {
			throw new NotFoundException("entity.person");
		}

		Set<UUID> alreadyOnList = new HashSet<>(paymentRepository.findPersonIdsByListId(list.getId()));
		int added = 0;

		for (Person person : persons) {
			if (alreadyOnList.contains(person.getId())) {
				continue;
			}

			paymentRepository.save(newPayment(list, person));
			added++;
		}

		return added;
	}

	private static Payment newPayment(PaymentList list, Person person) {
		return Payment.builder()
				.list(list)
				.person(person)
				.amountToPay(Money.ZERO)
				.amountPaid(Money.ZERO)
				.build();
	}

	private UUID requireSourceList(CreateCustomListRequest request) {
		if (request.sourceListId() == null) {
			throw new InvalidOperationException("error.list_population_requires_source");
		}

		return request.sourceListId();
	}

	/**
	 * A short label for logs and audit records.
	 */
	static String describe(PaymentList list) {
		if (list.isStandard() && list.yearMonth() != null) {
			return list.isTournament() ? list.yearMonth() + " (tournament)" : list.yearMonth().toString();
		}

		return list.getName() != null ? "'" + list.getName() + "'" : String.valueOf(list.getId());
	}

	private UUID currentUserOrSystem() {
		try {
			return securityService.getCurrentUserId();
		} catch (RuntimeException e) {
			return null;
		}
	}

	/**
	 * The month the scheduler should be looking at.
	 */
	public YearMonth currentMonth() {
		return clock.currentYearMonth();
	}
}
