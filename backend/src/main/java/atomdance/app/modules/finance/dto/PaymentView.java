package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentLine;
import atomdance.app.modules.finance.model.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record PaymentView(
		UUID id,
		String code,
		UUID listId,
		UUID personId,
		String personName,
		String personPhone,
		BigDecimal amountToPay,
		BigDecimal amountPaid,
		BigDecimal outstanding,
		BigDecimal overpayment,
		boolean settled,
		PaymentMethod paymentMethod,
		Instant paidAt,
		boolean fakePayment,
		UUID settledByPaymentId,
		boolean contractReturned,
		String note,
		List<PaymentLineView> lines
) {

	/**
	 * Membership charges first, then hand-added ones, each in the order the charges were numbered.
	 */
	private static final Comparator<PaymentLine> DISPLAY_ORDER = Comparator
			.comparingInt((PaymentLine line) -> line.getKind().ordinal())
			.thenComparing(PaymentLine::getNumber, Comparator.nullsLast(Comparator.naturalOrder()));


	public static PaymentView from(Payment payment) {
		List<PaymentLineView> lines = payment.getLines().stream()
				.sorted(DISPLAY_ORDER)
				.map(PaymentLineView::from)
				.toList();

		return build(payment, lines);
	}

	public static PaymentView withoutLines(Payment payment) {
		return build(payment, null);
	}

	private static PaymentView build(Payment payment, List<PaymentLineView> lines) {
		return new PaymentView(
				payment.getId(),
				payment.getCode(),
				payment.getList().getId(),
				payment.getPerson().getId(),
				payment.getPerson().getFullName(),
				payment.getPerson().getEffectivePhone(),
				payment.getAmountToPay(),
				payment.getAmountPaid(),
				payment.getOutstanding(),
				payment.getOverpayment(),
				payment.isSettled(),
				payment.getPaymentMethod(),
				payment.getPaidAt(),
				payment.isFakePayment(),
				payment.getSettledByPayment() == null ? null : payment.getSettledByPayment().getId(),
				payment.isContractReturned(),
				payment.getNote(),
				lines
		);
	}
}
