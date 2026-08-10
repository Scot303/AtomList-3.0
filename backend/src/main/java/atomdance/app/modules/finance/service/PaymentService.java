package atomdance.app.modules.finance.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.dto.*;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentCode;
import atomdance.app.modules.finance.model.PaymentLine;
import atomdance.app.modules.finance.model.PaymentLineKind;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * What each person owes and has paid on a list.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

	private final PaymentRepository paymentRepository;
	private final PaymentListService paymentListService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;

	public Payment getOrThrow(UUID id) {
		return paymentRepository.findByIdWithLines(id)
				.orElseThrow(() -> new NotFoundException("entity.payment"));
	}

	@Transactional(readOnly = true)
	public List<PaymentView> getForList(UUID listId) {
		paymentListService.getOrThrow(listId);

		return paymentRepository.findByListId(listId).stream().map(PaymentView::withoutLines).toList();
	}

	@Transactional(readOnly = true)
	public PaymentView get(UUID id) {
		return PaymentView.from(getOrThrow(id));
	}

	@Transactional(readOnly = true)
	public PaymentView getByCode(String code) {
		Long number = PaymentCode.parse(code)
				.orElseThrow(() -> new NotFoundException("entity.payment"));

		return PaymentView.from(paymentRepository.findByNumberWithLines(number)
				.orElseThrow(() -> new NotFoundException("entity.payment")));
	}

	@Transactional
	public PaymentView update(UUID id, UpdatePaymentRequest request) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		if (request.contractReturned() != null) {
			if (!payment.getList().tracksContracts()) {
				throw new InvalidOperationException("error.contract_tracking_not_applicable");
			}

			payment.setContractReturned(request.contractReturned());
		}

		if (request.note() != null) {
			payment.setNote(request.note());
		}

		return PaymentView.from(payment);
	}

	/**
	 * Records what somebody handed over, which may be more than they owed.
	 */
	@Transactional
	public PaymentView recordPayment(UUID id, RecordPaymentRequest request) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		if (payment.isFakePayment()) {
			throw new InvalidOperationException("error.payment_is_fake");
		}

		BigDecimal amount = Money.normalize(request.amountPaid());

		if (Money.isPositive(amount) && request.paymentMethod() == null) {
			throw new InvalidOperationException("error.payment_method_required");
		}

		guardAgainstUnfundingAllocations(payment, amount);

		BigDecimal previous = payment.getAmountPaid();

		payment.setAmountPaid(amount);
		payment.setPaymentMethod(Money.isZero(amount) ? null : request.paymentMethod());
		payment.setPaidAt(Money.isZero(amount) ? null : (request.paidAt() != null ? request.paidAt() : Instant.now()));

		log.info("Recorded {} on payment {} [{}] (was {}) via {}", amount, payment.getCode(), id, previous, payment.getPaymentMethod());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Payment %s for %s on list %s changed from %s to %s (%s).",
				payment.getCode(), payment.getPerson().getFullName(), PaymentListService.describe(payment.getList()), previous, amount, payment.getPaymentMethod()));

		return PaymentView.from(payment);
	}

	@Transactional
	public PaymentView addOneTimeLine(UUID id, SaveOneTimeLineRequest request) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		PaymentLine line = PaymentLine.builder()
				.kind(PaymentLineKind.ONE_TIME)
				.description(request.description().trim())
				.unitCost(Money.normalize(request.unitCost()))
				.quantity(request.quantity() != null ? Money.normalize(request.quantity()) : BigDecimal.ONE)
				.build();

		line.applyDiscount(Money.ZERO);

		payment.addLine(line);
		payment.recalculateAmountToPay();

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("One-off charge '%s' of %s added for %s on payment %s.",
				line.getDescription(), line.getSubtotal(), payment.getPerson().getFullName(), payment.getCode()));

		return PaymentView.from(payment);
	}

	/**
	 * Sets how many classes somebody attended, for a per-class group - or the quantity on a one-off charge.
	 */
	@Transactional
	public PaymentView updateLineQuantity(UUID id, UUID lineId, UpdateLineQuantityRequest request) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		PaymentLine line = lineOrThrow(payment, lineId);

		if (line.getKind() == PaymentLineKind.MEMBERSHIP_MONTHLY) {
			throw new InvalidOperationException("error.monthly_line_quantity_fixed");
		}

		line.setQuantity(Money.normalize(request.quantity()));
		line.applyDiscount(line.getDiscountPercent());

		payment.recalculateAmountToPay();

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Quantity on '%s' for %s set to %s, giving %s on payment %s.",
				line.getDescription(), payment.getPerson().getFullName(), line.getQuantity(), payment.getAmountToPay(), payment.getCode()));

		return PaymentView.from(payment);
	}

	@Transactional
	public PaymentView deleteLine(UUID id, UUID lineId) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		PaymentLine line = lineOrThrow(payment, lineId);

		if (line.getKind().isMembershipDerived()) {
			// A membership line is regenerated by the next recalculation, so deleting it here would achieve nothing. Ending the membership is what removes the charge.
			throw new InvalidOperationException("error.cannot_delete_membership_line");
		}

		payment.getLines().remove(line);
		payment.recalculateAmountToPay();

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("One-off charge '%s' removed for %s on payment %s.",
				line.getDescription(), payment.getPerson().getFullName(), payment.getCode()));

		return PaymentView.from(payment);
	}

	/**
	 * Refuses to reduce a payment below what has already been handed out to other months.
	 */
	private void guardAgainstUnfundingAllocations(Payment payment, BigDecimal newAmountPaid) {
		BigDecimal allocated = Money.normalize(paymentRepository.sumAllocatedFrom(payment.getId()));

		if (Money.isZero(allocated)) {
			return;
		}

		BigDecimal availableOverpayment = Money.atLeastZero(Money.subtract(newAmountPaid, payment.getAmountToPay()));

		if (Money.isGreaterThan(allocated, availableOverpayment)) {
			throw new InvalidOperationException("error.overpayment_already_allocated", allocated);
		}
	}

	private static PaymentLine lineOrThrow(Payment payment, UUID lineId) {
		return payment.getLines().stream()
				.filter(line -> lineId.equals(line.getId()))
				.findFirst()
				.orElseThrow(() -> new NotFoundException("entity.payment_line"));
	}
}
