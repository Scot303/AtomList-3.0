package atomdance.app.modules.finance.payment.model;

import java.util.Comparator;


/**
 * The order in which a list's charges are read on screen and on paper.
 */
public final class PaymentOrder {

	private PaymentOrder() {
	}


	public static final Comparator<Payment> DISPLAY_ORDER = Comparator
			.comparing((Payment payment) -> payment.getPerson().getLastName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparing(payment -> payment.getPerson().getName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparingInt(payment -> payment.getChargeKind() == null ? 0 : payment.getChargeKind().ordinal())
			.thenComparing(Payment::getLabel, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
			.thenComparing(Payment::getNumber, Comparator.nullsLast(Comparator.naturalOrder()));
}
