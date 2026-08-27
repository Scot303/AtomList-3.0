package atomdance.app.modules.finance.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.discount.service.DiscountService;
import atomdance.app.modules.finance.dto.AddPersonsRequest;
import atomdance.app.modules.finance.dto.CreateCustomListRequest;
import atomdance.app.modules.finance.dto.PaymentListView;
import atomdance.app.modules.finance.dto.UpdateCustomListRequest;
import atomdance.app.modules.finance.model.*;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.finance.repository.TransactionRepository;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.group.service.GroupService;
import atomdance.app.modules.instructor.model.ContractType;
import atomdance.app.modules.instructor.service.InstructorService;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
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

	private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt");

	private final PaymentListRepository paymentListRepository;
	private final PaymentRepository paymentRepository;
	private final TransactionRepository transactionRepository;
	private final MembershipRepository membershipRepository;
	private final GroupService groupService;
	private final PersonRepository personRepository;
	private final DiscountService discountService;
	private final PaymentCalculator paymentCalculator;
	private final StandardListProvisioner standardListProvisioner;
	private final InstructorExpenseService instructorExpenseService;
	private final InstructorService instructorService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;


	public PaymentList getOrThrow(UUID id) {
		return paymentListRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("entity.list"));
	}


	/**
	 * Every list, newest first.
	 */
	@Transactional(readOnly = true)
	public List<PaymentListView> getAll() {
		return paymentListRepository.findAll(NEWEST_FIRST).stream().map(PaymentListView::from).toList();
	}


	/**
	 * Every ad-hoc list, newest first.
	 */
	@Transactional(readOnly = true)
	public List<PaymentListView> getCustom() {
		return paymentListRepository.findByTypeIn(ListType.customTypes(), NEWEST_FIRST).stream().map(PaymentListView::from).toList();
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

		if (!list.isOffSeason()) {
			instructorExpenseService.seed(list, instructorService.findActive(ContractType.valueOf(list.scope().name())));
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
		ListType type = tournament ? ListType.STANDARD_TOURNAMENT : ListType.STANDARD;

		if (create) {
			return PaymentListView.from(ensureStandardList(yearMonth, type));
		}

		return paymentListRepository.findByYearAndMonthAndType(year, month, type)
				.map(PaymentListView::from)
				.orElseThrow(() -> new NotFoundException("entity.list"));
	}

	// ---------------------------------------------------------------- custom lists


	/**
	 * Builds an ad-hoc list from either of the two ways a user picks who belongs on it.
	 */
	@Transactional
	public PaymentListView createCustom(CreateCustomListRequest request) {
		boolean camp = Boolean.TRUE.equals(request.campList());

		PaymentList list = paymentListRepository.saveAndFlush(PaymentList.builder()
				.type(camp ? ListType.CAMP : ListType.CUSTOM)
				.name(request.name().trim())
				.status(ListStatus.OPEN)
				.populationMode(request.populationMode())
				.fixedPrice(request.fixedPrice() == null ? null : Money.normalize(request.fixedPrice()))
				.note(request.note())
				.build());

		int added = populateCustom(list, request);

		log.info("Created {} list {} ({}) with {} person(s) via {}", list.getType(), list.getId(), list.getName(), added, request.populationMode());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s list '%s' has been created with %d person(s) via %s.", list.getType(), list.getName(), added, request.populationMode()));

		return PaymentListView.from(list);
	}


	@Transactional
	public PaymentListView updateCustom(UUID id, UpdateCustomListRequest request) {
		PaymentList list = getOrThrow(id);

		if (list.isStandard()) {
			throw new InvalidOperationException("error.cannot_edit_standard_list");
		}

		list.assertOpen();

		if (request.name() != null) {
			list.setName(request.name().trim());
		}

		if (request.fixedPrice() != null) {
			list.setFixedPrice(Money.normalize(request.fixedPrice()));
		}

		if (request.note() != null) {
			list.setNote(request.note());
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s has been edited.", describe(list)));

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

				yield attachPersons(list, membershipRepository.findActivePersonIdsInGroups(list.getSourceGroupIds()), null);
			}

			case BY_PERSONS -> throw new InvalidOperationException("error.list_not_repopulatable");
		};

		log.info("Repopulated list {} via {}, adding {} person(s)", list.getId(), list.getPopulationMode(), added);
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s repopulated, adding %d person(s).", describe(list), added));

		return PaymentListView.from(list);
	}


	/**
	 * Adds specific people to an existing open list, billing them for a group where the list bills groups.
	 */
	@Transactional
	public PaymentListView addPersons(UUID id, AddPersonsRequest request) {
		PaymentList list = getOrThrow(id);
		list.assertOpen();

		Group group = request.groupId() == null ? null : groupService.getOrThrow(request.groupId());

		int added = attachPersons(list, request.personIds(), group);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%d person(s) added to list %s%s.", added, describe(list),
				group == null ? "" : " for group " + group.getName()));

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
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s has been recalculated.", describe(list)));

		return PaymentListView.from(list);
	}


	/**
	 * Rebuilds every open monthly list, for when something a list reads but does not own has changed - a family
	 * gaining or losing a member, a membership cost being edited.
	 * <p>
	 * Only standard lists are touched. A custom list's charges are put there by hand rather than derived from
	 * memberships, so nothing outside it can make them wrong.
	 *
	 * @return how many lists were rebuilt
	 */
	@Transactional
	public int recalculateOpenStandardLists() {
		List<PaymentList> open = paymentListRepository.findOpenStandard().stream()
				.filter(list -> !list.isOffSeason())
				.toList();

		for (PaymentList list : open) {
			syncStandardPayments(list);
		}

		if (!open.isEmpty()) {
			log.info("Rebuilt {} open standard list(s): {}", open.size(), open.stream().map(PaymentListService::describe).toList());
		}

		return open.size();
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
		//TODO: admin bypass needed - cascade all (only for custom / camp lists)
		PaymentList list = getOrThrow(id);
		list.assertOpen();

		if (paymentRepository.hasSettlementsOnList(id)) {
			throw new InvalidOperationException("error.list_holds_money");
		}

		transactionRepository.deleteByListId(id);
		paymentRepository.deleteAll(paymentRepository.findByListId(id));
		paymentListRepository.delete(list);

		log.info("Deleted list {} ({})", id, describe(list));
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), id, AuditEventType.LIST_MANAGEMENT, AuditOutcome.SUCCESS, String.format("List %s has been deleted.", describe(list)));
	}

	// ---------------------------------------------------------------- population internals


	/**
	 * Brings a monthly list's rows and amounts into line with the memberships that were running that month and belong on this sheet.
	 * <p>
	 * Does nothing for a month outside the season - where no membership bills anything.
	 */
	private void syncStandardPayments(PaymentList list) {
		YearMonth month = list.yearMonth();

		if (month == null) {
			throw new InvalidOperationException("error.standard_list_requires_month");
		}

		if (Season.isOffSeason(month)) {
			return;
		}

		List<Membership> monthMemberships = membershipRepository.findActiveDuring(month.atDay(1), month.atEndOfMonth(), true);
		List<Membership> billable = billableOn(list, monthMemberships);
		List<Payment> existing = paymentRepository.findByListIdForCalculation(list.getId());

		PaymentCalculator.Recalculation result = paymentCalculator.recalculate(list, existing, billable, monthMemberships, discountService.currentRules());

		paymentRepository.saveAll(result.created());

		// Removes former membership-derived payments no longer represented by a billable membership and with no money settled against them
		if (!result.obsolete().isEmpty()) {
			paymentRepository.deleteAll(result.obsolete());
		}
	}


	/**
	 * The memberships a sheet charges for: those whose fees are paid into the same account this sheet's are.
	 * <p>
	 * Only ever called for a standard list, where the two accounts map one-to-one onto the month's two sheets.
	 */
	private static List<Membership> billableOn(PaymentList list, Collection<Membership> memberships) {
		return memberships.stream()
				.filter(membership -> DepositScope.of(membership.getGroup().getType()) == list.scope())
				.toList();
	}


	private static void requireStandardType(ListType type) {
		if (type == null || !type.isStandard()) {
			throw new InvalidOperationException("error.not_a_standard_list_type");
		}
	}


	private int populateCustom(PaymentList list, CreateCustomListRequest request) {
		return switch (request.populationMode()) {
			case BY_GROUPS -> {
				if (request.groupIds() == null || request.groupIds().isEmpty()) {
					throw new InvalidOperationException("error.list_population_requires_groups");
				}

				list.getSourceGroupIds().addAll(request.groupIds());

				yield attachPersons(list, membershipRepository.findActivePersonIdsInGroups(request.groupIds()), null);
			}
			case BY_PERSONS -> {
				if (request.personIds() == null || request.personIds().isEmpty()) {
					throw new InvalidOperationException("error.list_population_requires_persons");
				}

				yield attachPersons(list, request.personIds(), null);
			}
		};
	}


	/**
	 * Puts people on a list, each with one charge to fill in afterwards.
	 *
	 * @return how many people were added, skipping anybody the charge would duplicate
	 */
	private int attachPersons(PaymentList list, Collection<UUID> personIds, Group group) {
		if (list.requiresGroup() == (group == null)) {
			throw new InvalidOperationException(group == null ? "error.charge_requires_group" : "error.charge_takes_no_group");
		}

		if (group != null) {
			requireSameAccount(list, group);
		}

		List<UUID> distinct = personIds.stream().distinct().toList();
		List<Person> persons = personRepository.findAllByIdWithFamily(distinct);

		if (persons.size() != distinct.size()) {
			throw new NotFoundException("entity.person");
		}

		Set<UUID> alreadyBilled = new HashSet<>(group == null
				? paymentRepository.findPersonIdsByListId(list.getId())
				: paymentRepository.findPersonIdsByListIdAndGroupId(list.getId(), group.getId()));

		int added = 0;

		for (Person person : persons) {
			if (alreadyBilled.contains(person.getId())) {
				continue;
			}

			paymentRepository.save(handAddedCharge(list, person, group));
			added++;
		}

		return added;
	}


	private static Payment handAddedCharge(PaymentList list, Person person, Group group) {
		boolean perClass = group != null && group.isPerClass();

		Payment payment = Payment.builder()
				.list(list)
				.person(person)
				.chargeKind(PaymentChargeKind.ONE_TIME)
				.group(group)
				.description(group == null ? list.getName() : group.getName())
				.unitCost(group == null ? list.defaultUnitCost() : Money.normalize(group.getCostForAttending()))
				.quantity(perClass ? Money.ZERO : BigDecimal.ONE)
				.build();

		payment.applyDiscount(Money.ZERO);

		return payment;
	}


	/**
	 * Refuses a group whose fees are paid into the other account, which would file its money under the wrong pot.
	 */
	static void requireSameAccount(PaymentList list, Group group) {
		if (DepositScope.of(group.getType()) != list.scope()) {
			throw new InvalidOperationException("error.group_wrong_account");
		}
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

}
