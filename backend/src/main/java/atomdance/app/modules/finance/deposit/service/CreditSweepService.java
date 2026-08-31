package atomdance.app.modules.finance.deposit.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.deposit.dto.*;
import atomdance.app.modules.finance.deposit.model.Deposit;
import atomdance.app.modules.finance.deposit.repository.DepositRepository;
import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.repository.PaymentRepository;
import atomdance.app.modules.finance.payment.service.SettlementService;
import atomdance.app.modules.finance.paymentList.model.PaymentList;
import atomdance.app.modules.finance.paymentList.service.PaymentListService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;


/**
 * Spends everybody's leftover credit on one list, in one confirmed step.
 */
@Service
@RequiredArgsConstructor
public class CreditSweepService {

	private static final Comparator<Payment> IN_SWEEP_ORDER = Comparator
			.comparing((Payment payment) -> payment.getPerson().getLastName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparing(payment -> payment.getPerson().getName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparing(Payment::getLabel, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
			.thenComparing(Payment::getNumber, Comparator.nullsLast(Comparator.naturalOrder()));

	private final PaymentListService paymentListService;
	private final PaymentRepository paymentRepository;
	private final DepositRepository depositRepository;
	private final SettlementService settlementService;
	private final AuditLogger auditLogger;


	// ---------------------------------------------------------------- Reading


	@Transactional(readOnly = true)
	public CreditSweepView preview(UUID listId) {
		Sweep sweep = plan(listId);

		auditLogger.read(AuditEventType.DEPOSIT_PREVIEW, listId, "Leftover credit previewed for list %s.", PaymentListService.describeList(sweep.list()));

		return toView(sweep);
	}


	// ---------------------------------------------------------------- Writing


	/**
	 * Spends the credit, settling what the manager approved.
	 */
	@Transactional
	public CreditSweepResultView apply(UUID listId, SettleCreditRequest request) {
		Sweep sweep = plan(listId);

		if (sweep.isEmpty()) {
			throw new InvalidOperationException("error.nothing_to_settle");
		}

		assertMatchesWhatWasApproved(sweep, request.expected());

		for (Line line : sweep.lines()) {
			settlementService.settle(line.deposit(), line.payment(), line.amount(), Instant.now());
		}

		BigDecimal remainingCredit = Money.ZERO;

		for (DepositSweep entry : sweep.deposits()) {
			remainingCredit = Money.add(remainingCredit, entry.deposit().getUnallocatedAmount());
		}

		int depositCount = sweep.deposits().size();
		int paymentCount = sweep.paymentCount();
		BigDecimal allocated = sweep.allocatedTotal();

		auditLogger.success(AuditEventType.DEPOSIT_MANAGEMENT, sweep.list().getId(),
				"%s of leftover credit from %d deposit(s) settled %d charge(s) on list %s; %s left as credit.", allocated, depositCount, paymentCount, PaymentListService.describeList(sweep.list()), remainingCredit);

		return new CreditSweepResultView(depositCount, paymentCount, allocated, remainingCredit);
	}


	// ---------------------------------------------------------------- Planning


	/**
	 * The one place the sweep is worked out, so the preview and the confirmation can never disagree about it.
	 */
	private Sweep plan(UUID listId) {
		PaymentList list = paymentListService.getOrThrow(listId);

		List<Payment> unpaid = paymentRepository.findUnpaidByListId(listId).stream()
				.sorted(IN_SWEEP_ORDER)
				.toList();

		if (unpaid.isEmpty()) {
			return new Sweep(list, List.of());
		}

		Set<UUID> personIds = new LinkedHashSet<>();

		for (Payment payment : unpaid) {
			personIds.add(payment.getPerson().getId());
		}

		Map<UUID, BigDecimal> remainingOnPayment = new HashMap<>();

		for (Payment payment : unpaid) {
			remainingOnPayment.put(payment.getId(), payment.getOutstanding());
		}

		List<DepositSweep> planned = new ArrayList<>();

		for (Deposit deposit : depositRepository.findWithCreditForPersons(personIds)) {
			BigDecimal creditAvailable = deposit.getUnallocatedAmount();

			if (!Money.isPositive(creditAvailable) || !deposit.maySettleOn(list)) {
				continue;
			}

			BigDecimal credit = creditAvailable;
			Set<UUID> covered = new HashSet<>(deposit.getCoveredPersonIds());
			List<Line> lines = new ArrayList<>();

			for (Payment payment : unpaid) {
				if (!Money.isPositive(credit)) {
					break;
				}

				if (!covered.contains(payment.getPerson().getId())) {
					continue;
				}

				BigDecimal owed = remainingOnPayment.get(payment.getId());

				if (!Money.isPositive(owed)) {
					continue;
				}

				BigDecimal amount = Money.min(owed, credit);

				lines.add(new Line(deposit, payment, amount, owed));

				remainingOnPayment.put(payment.getId(), Money.subtract(owed, amount));
				credit = Money.subtract(credit, amount);
			}

			// A handover whose people owe nothing here is left out altogether rather than listed as contributing zero.
			if (!lines.isEmpty()) {
				planned.add(new DepositSweep(deposit, creditAvailable, List.copyOf(lines)));
			}
		}

		return new Sweep(list, List.copyOf(planned));
	}


	/**
	 * Refuses to settle anything other than what the manager was shown.
	 */
	private static void assertMatchesWhatWasApproved(Sweep sweep, List<SettleCreditRequest.Entry> expected) {
		if (expected == null || expected.isEmpty()) {
			return;
		}

		List<Line> lines = sweep.lines();

		if (expected.size() != lines.size()) {
			throw new InvalidOperationException("error.deposit_plan_stale");
		}

		for (int index = 0; index < expected.size(); index++) {
			Line line = lines.get(index);
			SettleCreditRequest.Entry approved = expected.get(index);

			boolean same = line.deposit().getId().equals(approved.depositId())
					&& line.payment().getId().equals(approved.paymentId())
					&& line.amount().compareTo(Money.normalize(approved.amount())) == 0;

			if (!same) {
				throw new InvalidOperationException("error.deposit_plan_stale");
			}
		}
	}


	// ---------------------------------------------------------------- Views


	private static CreditSweepView toView(Sweep sweep) {
		List<CreditSweepView.Entry> entries = new ArrayList<>();
		BigDecimal creditAvailable = Money.ZERO;

		for (DepositSweep planned : sweep.deposits()) {
			Deposit deposit = planned.deposit();
			BigDecimal allocated = planned.allocated();

			creditAvailable = Money.add(creditAvailable, planned.creditAvailable());

			entries.add(new CreditSweepView.Entry(
					deposit.getId(),
					deposit.getCode(),
					deposit.getCoveredPersonsInDisplayOrder().stream().map(CoveredPersonView::from).toList(),
					deposit.getPaymentMethod(),
					deposit.getReceivedAt(),
					planned.creditAvailable(),
					allocated,
					Money.subtract(planned.creditAvailable(), allocated),
					planned.lines().stream()
							.map(line -> PlannedSettlementView.of(line.payment(), line.amount(), line.outstandingBefore()))
							.toList()
			));
		}

		BigDecimal allocatedTotal = sweep.allocatedTotal();

		return new CreditSweepView(
				sweep.list().getId(),
				creditAvailable,
				allocatedTotal,
				Money.subtract(creditAvailable, allocatedTotal),
				entries.size(),
				sweep.paymentCount(),
				List.copyOf(entries)
		);
	}


	// ---------------------------------------------------------------- Internal shape


	private record Line(Deposit deposit, Payment payment, BigDecimal amount, BigDecimal outstandingBefore) {}


	/**
	 * One handover's whole contribution to the sweep.
	 *
	 * @param creditAvailable what it held before any of this was applied
	 */
	private record DepositSweep(Deposit deposit, BigDecimal creditAvailable, List<Line> lines) {

		BigDecimal allocated() {
			BigDecimal total = Money.ZERO;

			for (Line line : lines) {
				total = Money.add(total, line.amount());
			}

			return total;
		}
	}


	/**
	 * Every handover that would move, in the order their money is spent.
	 */
	private record Sweep(PaymentList list, List<DepositSweep> deposits) {

		boolean isEmpty() {
			return deposits.isEmpty();
		}


		List<Line> lines() {
			return deposits.stream().flatMap(entry -> entry.lines().stream()).toList();
		}


		BigDecimal allocatedTotal() {
			BigDecimal total = Money.ZERO;

			for (DepositSweep entry : deposits) {
				total = Money.add(total, entry.allocated());
			}

			return total;
		}


		int paymentCount() {
			return (int) lines().stream().map(line -> line.payment().getId()).distinct().count();
		}
	}
}
