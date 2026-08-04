package atomdance.app.modules.finance.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.dto.AllocateOverpaymentRequest;
import atomdance.app.modules.finance.dto.OverpaymentCandidateView;
import atomdance.app.modules.finance.dto.OverpaymentOptionsView;
import atomdance.app.modules.finance.dto.PaymentView;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spreads an overpayment across the months it was actually meant for.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OverpaymentService {

	private static final int FUTURE_MONTHS_OFFERED = 6;

	private final PaymentRepository paymentRepository;
	private final PaymentListRepository paymentListRepository;
	private final PaymentListService paymentListService;
	private final PaymentService paymentService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final AppClock clock;

	/**
	 * The months a manager can choose from, and how much is left to hand out.
	 */
	@Transactional(readOnly = true)
	public OverpaymentOptionsView candidates(UUID paymentId) {
		Payment source = paymentService.getOrThrow(paymentId);

		BigDecimal overpayment = source.getOverpayment();
		BigDecimal allocated = Money.normalize(paymentRepository.sumAllocatedFrom(paymentId));
		BigDecimal available = Money.atLeastZero(Money.subtract(overpayment, allocated));

		YearMonth reference = referenceMonth(source);
		List<OverpaymentCandidateView> past = new ArrayList<>();
		List<OverpaymentCandidateView> future = new ArrayList<>();

		for (PaymentList list : paymentListRepository.findStandardListsWithDebtFor(source.getPerson().getId(), source.getList().getId())) {
			YearMonth month = list.yearMonth();

			if (month == null) {
				continue;
			}

			Optional<Payment> debt = findPaymentOn(list.getId(), source.getPerson().getId());

			if (debt.isEmpty()) {
				continue;
			}

			boolean isPast = month.isBefore(reference);
			OverpaymentCandidateView candidate = new OverpaymentCandidateView(list.getId(), debt.get().getId(), month.getYear(), month.getMonthValue(), list.isTournament(), debt.get()
					.getOutstanding(), isPast);

			(isPast ? past : future).add(candidate);
		}

		if (!past.isEmpty()) {
			return new OverpaymentOptionsView(overpayment, allocated, available, false, past, existingAllocations(paymentId));
		}

		return new OverpaymentOptionsView(overpayment, allocated, available, true, withUncreatedFutureMonths(future, reference), existingAllocations(paymentId));
	}

	/**
	 * Marks each chosen month as settled out of this payment's overpayment.
	 */
	@Transactional
	public PaymentView allocate(UUID paymentId, AllocateOverpaymentRequest request) {
		Payment source = paymentService.getOrThrow(paymentId);

		if (source.isFakePayment()) {
			throw new InvalidOperationException("error.payment_is_fake");
		}

		BigDecimal available = Money.atLeastZero(Money.subtract(source.getOverpayment(), Money.normalize(paymentRepository.sumAllocatedFrom(paymentId))));

		if (!Money.isPositive(available)) {
			throw new InvalidOperationException("error.no_overpayment_available");
		}

		for (AllocateOverpaymentRequest.Target target : request.targets()) {
			YearMonth month = YearMonth.of(target.year(), target.month());
			ListType type = ListType.standardFor(Boolean.TRUE.equals(target.tournamentList()));

			PaymentList list = paymentListService.ensureStandardList(month, type);

			if (list.getId().equals(source.getList().getId())) {
				throw new InvalidOperationException("error.cannot_allocate_to_self");
			}

			Payment destination = findPaymentOn(list.getId(), source.getPerson().getId())
					.orElseThrow(() -> new InvalidOperationException("error.person_not_on_list"));

			available = settle(source, destination, target.amount(), available);

			if (!Money.isPositive(available)) {
				break;
			}
		}

		return PaymentView.from(paymentService.getOrThrow(paymentId));
	}

	/**
	 * Undoes an assignment, returning the money to the payment it came from.
	 */
	@Transactional
	public PaymentView removeAllocation(UUID paymentId) {
		Payment payment = paymentService.getOrThrow(paymentId);

		if (!payment.isFakePayment()) {
			throw new InvalidOperationException("error.payment_not_fake");
		}

		UUID sourceId = payment.getSettledByPayment() == null ? null : payment.getSettledByPayment().getId();

		payment.setAmountPaid(Money.ZERO);
		payment.setPaymentMethod(null);
		payment.setPaidAt(null);
		payment.setFakePayment(false);
		payment.setSettledByPayment(null);

		log.info("Removed the overpayment assignment on payment {} (was funded by {})", paymentId, sourceId);
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), paymentId, AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Overpayment assignment removed for %s on list %s; the month is owing again.",
				payment.getPerson().getFullName(), PaymentListService.describe(payment.getList())));

		return PaymentView.from(payment);
	}

	/**
	 * Writes the fake payment.
	 */
	private BigDecimal settle(Payment source, Payment destination, BigDecimal requested, BigDecimal available) {
		if (destination.getId().equals(source.getId())) {
			throw new InvalidOperationException("error.cannot_allocate_to_self");
		}

		if (!destination.getList().isStandard()) {
			throw new InvalidOperationException("error.can_only_allocate_to_standard_lists");
		}

		assertHoldsNoRealMoney(destination);

		if (destination.isSettled() && !destination.isFakePayment()) {
			throw new InvalidOperationException("error.payment_already_settled");
		}

		BigDecimal owed = Money.atLeastZero(Money.subtract(destination.getAmountToPay(), destination.getAmountPaid()));
		BigDecimal amount = Money.min(requested != null ? Money.normalize(requested) : owed, available);

		if (!Money.isPositive(amount)) {
			throw new InvalidOperationException("error.overpayment_exceeded", available);
		}

		destination.setAmountPaid(Money.add(destination.getAmountPaid(), amount));
		destination.setFakePayment(true);
		destination.setSettledByPayment(source);
		// Copied from the real payment so an export shows how the money actually arrived.
		destination.setPaymentMethod(source.getPaymentMethod());
		destination.setPaidAt(source.getPaidAt());

		log.info("Assigned {} of payment {}'s overpayment to {} on list {}{}",
				amount, source.getId(), destination.getPerson().getFullName(),
				PaymentListService.describe(destination.getList()),
				destination.getList().isClosed() ? " (closed - marked as a fake payment only)" : "");

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), destination.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("%s of the overpayment from list %s assigned to %s on list %s, marked as a fake payment.",
						amount, PaymentListService.describe(source.getList()), destination.getPerson().getFullName(), PaymentListService.describe(destination.getList())
				)
		);

		return Money.subtract(available, amount);
	}

	/**
	 * The invariant the whole scheme rests on: a fake row must hold no real money.
	 */
	private void assertHoldsNoRealMoney(Payment destination) {
		if (!destination.isFakePayment() && Money.isPositive(destination.getAmountPaid())) {
			throw new InvalidOperationException("error.payment_holds_real_money");
		}
	}

	/**
	 * Sheets with no list yet, offered so somebody can pay ahead. Assigning to one creates it.
	 */
	private List<OverpaymentCandidateView> withUncreatedFutureMonths(List<OverpaymentCandidateView> known, YearMonth reference) {
		List<OverpaymentCandidateView> candidates = new ArrayList<>(known);

		for (int ahead = 1; ahead <= FUTURE_MONTHS_OFFERED; ahead++) {
			YearMonth month = reference.plusMonths(ahead);

			for (ListType type : ListType.standardTypes()) {
				boolean alreadyOffered = candidates.stream()
						.anyMatch(candidate -> candidate.year() == month.getYear()
								&& candidate.month() == month.getMonthValue()
								&& candidate.tournamentList() == type.isTournament());

				if (alreadyOffered || paymentListRepository.existsByYearAndMonthAndType(month.getYear(), month.getMonthValue(), type)) {
					continue;
				}

				candidates.add(new OverpaymentCandidateView(null, null, month.getYear(), month.getMonthValue(), type.isTournament(), null, false));
			}
		}

		candidates.sort(java.util.Comparator.comparingInt(OverpaymentCandidateView::year)
				.thenComparingInt(OverpaymentCandidateView::month)
				.thenComparing(OverpaymentCandidateView::tournamentList));

		return candidates;
	}

	private List<OverpaymentCandidateView> existingAllocations(UUID paymentId) {
		return paymentRepository.findAllocationsOf(paymentId).stream()
				.map(allocation -> new OverpaymentCandidateView(
						allocation.getList().getId(),
						allocation.getId(),
						allocation.getList().getYear() == null ? 0 : allocation.getList().getYear(),
						allocation.getList().getMonth() == null ? 0 : allocation.getList().getMonth(),
						allocation.getList().isTournament(),
						allocation.getAmountPaid(),
						false))
				.toList();
	}

	/**
	 * What "past" and "future" are measured against.
	 */
	private YearMonth referenceMonth(Payment source) {
		YearMonth month = source.getList().yearMonth();

		return month != null ? month : clock.currentYearMonth();
	}

	private Optional<Payment> findPaymentOn(UUID listId, UUID personId) {
		return paymentRepository.findByListIdAndPersonIdsWithLines(listId, List.of(personId)).stream().findFirst();
	}
}
