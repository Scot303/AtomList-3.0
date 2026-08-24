package atomdance.app.modules.finance.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.dto.*;
import atomdance.app.modules.finance.model.*;
import atomdance.app.modules.finance.repository.DepositRepository;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.finance.repository.PaymentSettlementRepository;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.YearMonth;
import java.util.*;


@Slf4j
@Service
@RequiredArgsConstructor
public class DepositService {

	/**
	 * How far ahead somebody may pay by default, once they owe nothing.
	 */
	private static final int DEFAULT_MONTHS_AHEAD = 1;

	private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "receivedAt", "number");

	private final DepositRepository depositRepository;
	private final PaymentRepository paymentRepository;
	private final PaymentListRepository paymentListRepository;
	private final PaymentSettlementRepository settlementRepository;
	private final PersonRepository personRepository;
	private final DepositAllocationPlanner planner;
	private final SettlementService settlementService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final AppClock clock;


	public Deposit getOrThrow(UUID id) {
		return depositRepository.findByIdWithSettlements(id)
				.orElseThrow(() -> new NotFoundException("entity.deposit"));
	}


	// ---------------------------------------------------------------- Fetching


	@Transactional(readOnly = true)
	public List<DepositView> getHistory(Integer year) {
		List<Deposit> deposits = year == null
				? depositRepository.findAllBy(NEWEST_FIRST)
				: depositRepository.findByReceivedAtGreaterThanEqualAndReceivedAtLessThan(clock.startOf(YearMonth.of(year, 1)), clock.endOf(YearMonth.of(year, 12)), NEWEST_FIRST);

		return deposits.stream()
				.map(DepositView::withoutSettlements)
				.toList();
	}


	@Transactional(readOnly = true)
	public DepositView get(UUID id) {
		return withSettlementDetail(getOrThrow(id));
	}


	@Transactional(readOnly = true)
	public DepositView getByCode(String code) {
		Long number = DepositCode.parse(code)
				.orElseThrow(() -> new NotFoundException("entity.deposit"));

		return withSettlementDetail(depositRepository.findByNumberWithSettlements(number)
				.orElseThrow(() -> new NotFoundException("entity.deposit")));
	}


	/**
	 * Credit somebody has left over from earlier handovers.
	 */
	@Transactional(readOnly = true)
	public List<DepositView> getCreditFor(UUID personId) {
		return depositRepository.findWithCreditForPersons(List.of(personId)).stream()
				.map(DepositView::withoutSettlements)
				.toList();
	}


	// ---------------------------------------------------------------- Planning


	/**
	 * What a sum of money would settle.
	 */
	@Transactional(readOnly = true)
	public DepositPlanView plan(PlanDepositRequest request) {
		List<UUID> personIds = distinct(request.personIds());
		requirePersonsExist(personIds);

		YearMonth reference = referenceMonth(request.receivedAt());
		int monthsAhead = monthsAhead(request.monthsAhead());

		ListType type = ListType.standardFor(request.scope());

		List<Payment> outstanding = paymentRepository.findOutstandingStandardForPersons(personIds, type);
		DepositAllocationPlanner.Plan plan = planner.plan(outstanding, personIds, reference, request.amount(), monthsAhead);

		auditLogger.record(securityService.getCurrentUserId(), null, AuditEventType.DEPOSIT_PREVIEW, AuditOutcome.SUCCESS,
				String.format("Allocation of %s previewed for %d person(s) on the %s sheet.", Money.normalize(request.amount()), personIds.size(), type));

		return DepositPlanView.from(plan, request.amount(), coversEverything(outstanding, plan), !isMonthBilled(reference.plusMonths(monthsAhead), type));
	}


	// ---------------------------------------------------------------- Saving


	/**
	 * Records the money and settles what the manager approved.
	 */
	@Transactional
	public DepositView create(CreateDepositRequest request) {
		List<UUID> personIds = distinct(request.personIds());
		Map<UUID, Person> persons = requirePersonsExist(personIds);

		Instant receivedAt = request.receivedAt() != null ? request.receivedAt() : Instant.now();
		YearMonth reference = referenceMonth(receivedAt);

		Deposit deposit = Deposit.builder()
				.coveredPersons(new LinkedHashSet<>(persons.values()))
				.totalAmount(Money.normalize(request.amount()))
				.paymentMethod(request.paymentMethod())
				.receivedAt(receivedAt)
				.scope(request.scope())
				.origin(DepositOrigin.COUNTER)
				.note(request.note())
				.createdByUserId(securityService.getCurrentUserId())
				.build();

		depositRepository.saveAndFlush(deposit);

		List<Payment> outstanding = paymentRepository.findOutstandingStandardForPersons(personIds, ListType.standardFor(request.scope()));
		DepositAllocationPlanner.Plan plan = planner.plan(outstanding, personIds, reference, request.amount(), monthsAhead(request.monthsAhead()));

		assertMatchesWhatWasApproved(plan, request.expected());

		for (DepositAllocationPlanner.PlannedSettlement planned : plan.settlements()) {
			settlementService.settle(deposit, planned.payment(), planned.amount(), receivedAt);
		}

		log.info("Recorded deposit {} of {} for {} via {}, settling {} payment(s) and leaving {} as credit",
				deposit.getCode(), deposit.getTotalAmount(), describeCoveredPersons(deposit), deposit.getPaymentMethod(), plan.settlements().size(), deposit.getUnallocatedAmount());

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), deposit.getId(), AuditEventType.DEPOSIT_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("Deposit %s of %s taken for %s via %s, settling %d payment(s); %s left as credit.",
						deposit.getCode(), deposit.getTotalAmount(), describeCoveredPersons(deposit), deposit.getPaymentMethod(), plan.settlements().size(), deposit.getUnallocatedAmount()));

		return withSettlementDetail(deposit);
	}


	/**
	 * Money handed over for one payment and nothing else.
	 */
	@Transactional
	public PaymentView settleDirect(UUID paymentId, SettleDirectRequest request) {
		Payment payment = paymentRepository.findByIdWithSettlements(paymentId)
				.orElseThrow(() -> new NotFoundException("entity.payment"));

		Instant receivedAt = request.receivedAt() != null ? request.receivedAt() : Instant.now();

		Deposit deposit = Deposit.builder()
				.coveredPersons(new LinkedHashSet<>(List.of(payment.getPerson())))
				.totalAmount(Money.normalize(request.amount()))
				.paymentMethod(request.paymentMethod())
				.receivedAt(receivedAt)
				.scope(payment.getList().scope())
				.origin(DepositOrigin.DIRECT)
				.note(request.note())
				.createdByUserId(securityService.getCurrentUserId())
				.build();

		depositRepository.saveAndFlush(deposit);

		settlementService.settle(deposit, payment, request.amount(), receivedAt);

		if (Money.isPositive(deposit.getUnallocatedAmount())) {
			log.info("Deposit {} left {} as credit - more than payment {} owed", deposit.getCode(), deposit.getUnallocatedAmount(), payment.getCode());
		}

		return PaymentView.from(payment);
	}


	/**
	 * Spends what is left of a deposit: where the manager says, or wherever a fresh plan would put it.
	 */
	@Transactional
	public DepositView allocate(UUID id, AllocateDepositRequest request) {
		Deposit deposit = getOrThrow(id);

		if (deposit.isFullyAllocated()) {
			throw new InvalidOperationException("error.deposit_fully_allocated");
		}

		if (request.targets() != null && !request.targets().isEmpty()) {
			for (AllocateDepositRequest.Target target : request.targets()) {
				Payment payment = paymentRepository.findByIdWithSettlements(target.paymentId())
						.orElseThrow(() -> new NotFoundException("entity.payment"));

				requireCoveredPersons(deposit, List.of(payment.getPerson().getId()));

				settlementService.settle(deposit, payment, target.amount(), Instant.now());

				if (deposit.isFullyAllocated()) {
					break;
				}
			}
		} else {
			List<UUID> personIds = request.personIds() != null && !request.personIds().isEmpty()
					? distinct(request.personIds())
					: deposit.getCoveredPersonIds();

			if (personIds.isEmpty()) {
				throw new InvalidOperationException("error.list_population_requires_persons");
			}

			requireCoveredPersons(deposit, personIds);

			ListType type = ListType.standardFor(deposit.getScope());

			List<Payment> outstanding = paymentRepository.findOutstandingStandardForPersons(personIds, type);
			DepositAllocationPlanner.Plan plan = planner.plan(outstanding, personIds, clock.monthOf(deposit.getReceivedAt()), deposit.getUnallocatedAmount(), monthsAhead(request.monthsAhead()));

			assertMatchesWhatWasApproved(plan, request.expected());

			if (plan.isEmpty()) {
				throw new InvalidOperationException("error.nothing_to_settle");
			}

			for (DepositAllocationPlanner.PlannedSettlement planned : plan.settlements()) {
				settlementService.settle(deposit, planned.payment(), planned.amount(), Instant.now());
			}
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), deposit.getId(), AuditEventType.DEPOSIT_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("Credit on deposit %s allocated; %s left.", deposit.getCode(), deposit.getUnallocatedAmount()));

		return withSettlementDetail(deposit);
	}


	/**
	 * Undoes one allocation, returning its amount to the deposit's credit and leaving that debt owing again.
	 */
	@Transactional
	public DepositView removeSettlement(UUID id, UUID settlementId) {
		Deposit deposit = getOrThrow(id);

		PaymentSettlement settlement = settlementRepository.findByIdWithRelations(settlementId)
				.orElseThrow(() -> new NotFoundException("entity.settlement"));

		if (!deposit.getId().equals(settlement.getDeposit().getId())) {
			throw new NotFoundException("entity.settlement");
		}

		settlementService.remove(settlement);

		return withSettlementDetail(getOrThrow(id));
	}


	/**
	 * Removes a handover recorded by mistake. Refused while any of it is still settling something - they must be undo first, so it is always visible which debts are about to start owing again.
	 */
	@Transactional
	public void delete(UUID id) {
		Deposit deposit = getOrThrow(id);

		if (!deposit.getSettlements().isEmpty()) {
			throw new InvalidOperationException("error.deposit_holds_settlements");
		}

		depositRepository.delete(deposit);

		log.info("Deleted deposit {} [{}] of {}", deposit.getCode(), id, deposit.getTotalAmount());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), id, AuditEventType.DEPOSIT_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("Deposit %s of %s for %s has been deleted.", deposit.getCode(), deposit.getTotalAmount(), describeCoveredPersons(deposit)));
	}


	// ---------------------------------------------------------------- Internal methods


	/**
	 * Refuses to settle anything other than what the manager was shown.
	 */
	private static void assertMatchesWhatWasApproved(DepositAllocationPlanner.Plan plan, List<ExpectedSettlement> expected) {
		if (expected == null || expected.isEmpty()) {
			return;
		}

		if (expected.size() != plan.settlements().size()) {
			throw new InvalidOperationException("error.deposit_plan_stale");
		}

		for (int index = 0; index < expected.size(); index++) {
			DepositAllocationPlanner.PlannedSettlement planned = plan.settlements().get(index);
			ExpectedSettlement approved = expected.get(index);

			boolean sameOnBothSides = planned.payment().getId().equals(approved.paymentId())
					&& planned.amount().compareTo(Money.normalize(approved.amount())) == 0;

			if (!sameOnBothSides) {
				throw new InvalidOperationException("error.deposit_plan_stale");
			}
		}
	}


	/**
	 * @return whether the plan leaves nothing owing among the debts it could reach
	 */
	private static boolean coversEverything(List<Payment> outstanding, DepositAllocationPlanner.Plan plan) {
		if (outstanding.isEmpty()) {
			return true;
		}

		return plan.settlements().size() == outstanding.size() && plan.settlements().stream().noneMatch(DepositAllocationPlanner.PlannedSettlement::partial);
	}


	/**
	 * Whether the sheet for a month exists at all. Money cannot be put against a month with no list, and a preview must not create one.
	 */
	private boolean isMonthBilled(YearMonth month, ListType type) {
		return paymentListRepository.findStandardFor(month.getYear(), month.getMonthValue()).stream()
				.anyMatch(list -> list.getType() == type);
	}


	/**
	 * The month "arrears" and "ahead" are measured against: the one the cash arrived in.
	 */
	private YearMonth referenceMonth(Instant receivedAt) {
		return receivedAt == null ? clock.currentYearMonth() : clock.monthOf(receivedAt);
	}


	private int monthsAhead(Integer requested) {
		return requested != null && requested >= 0 ? requested : DEFAULT_MONTHS_AHEAD;
	}


	/**
	 * How a handover names its people in a log line: the one name, or the first and how many more.
	 */
	private static String describeCoveredPersons(Deposit deposit) {
		List<Person> covered = deposit.getCoveredPersonsInDisplayOrder();

		if (covered.isEmpty()) {
			return "nobody";
		}

		String first = covered.getFirst().getFullName();

		return covered.size() == 1 ? first : String.format("%s and %d other(s)", first, covered.size() - 1);
	}


	/**
	 * Refuses to spend a deposit on anybody it was not handed over for.
	 */
	private static void requireCoveredPersons(Deposit deposit, Collection<UUID> personIds) {
		Set<UUID> covered = new HashSet<>(deposit.getCoveredPersonIds());

		if (!covered.containsAll(personIds)) {
			throw new InvalidOperationException("error.deposit_person_not_covered", listCoveredPersons(deposit));
		}
	}


	private static String listCoveredPersons(Deposit deposit) {
		return String.join(", ", deposit.getCoveredPersonsInDisplayOrder().stream().map(Person::getFullName).toList());
	}


	private static List<UUID> distinct(List<UUID> personIds) {
		return personIds == null ? List.of() : personIds.stream().filter(Objects::nonNull).distinct().toList();
	}


	private Map<UUID, Person> requirePersonsExist(List<UUID> personIds) {
		if (personIds.isEmpty()) {
			throw new InvalidOperationException("error.list_population_requires_persons");
		}

		List<Person> persons = personRepository.findAllByIdWithFamily(personIds);

		if (persons.size() != personIds.size()) {
			throw new NotFoundException("entity.person");
		}

		Map<UUID, Person> byId = new LinkedHashMap<>();

		for (Person person : persons) {
			byId.put(person.getId(), person);
		}

		return byId;
	}


	private DepositView withSettlementDetail(Deposit deposit) {
		return DepositView.from(deposit, settlementRepository.findByDepositId(deposit.getId()));
	}
}
