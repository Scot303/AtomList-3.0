package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentChargeKind;
import atomdance.app.modules.finance.model.PaymentSettlement;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;


/**
 * One billable item: what a person owes for one group, and what has been paid towards it.
 */
public record PaymentView(
		UUID id,
		Long number,
		String code,
		UUID listId,
		UUID personId,
		String personName,
		String personFirstName,
		String personLastName,
		String personPhone,
		PaymentChargeKind chargeKind,
		UUID groupId,
		UUID membershipId,
		String description,
		BigDecimal unitCost,
		BigDecimal quantity,
		BigDecimal gross,
		BigDecimal discountPercent,
		BigDecimal discountAmount,
		BigDecimal amountToPay,
		BigDecimal amountSettled,
		BigDecimal outstanding,
		boolean settled,
		boolean contractReturned,
		String note,
		List<SettlementView> settlements
) {

	/**
	 * How a list reads on screen and on paper: people alphabetically, each person's groups by name.
	 */
	public static final Comparator<Payment> DISPLAY_ORDER = Comparator
			.comparing((Payment payment) -> payment.getPerson().getLastName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparing(payment -> payment.getPerson().getName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparingInt(payment -> payment.getChargeKind() == null ? 0 : payment.getChargeKind().ordinal())
			.thenComparing(Payment::getLabel, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
			.thenComparing(Payment::getNumber, Comparator.nullsLast(Comparator.naturalOrder()));

	private static final Comparator<PaymentSettlement> SETTLEMENT_ORDER = Comparator
			.comparing(PaymentSettlement::getSettledAt, Comparator.nullsLast(Comparator.naturalOrder()))
			.thenComparing(PaymentSettlement::getNumber, Comparator.nullsLast(Comparator.naturalOrder()));


	public static PaymentView from(Payment payment) {
		return build(payment, payment.getSettlements().stream()
				.sorted(SETTLEMENT_ORDER)
				.map(SettlementView::from)
				.toList());
	}


	/**
	 * For a whole list, where the split of each payment is more detail than a table needs.
	 */
	public static PaymentView withoutSettlements(Payment payment) {
		return build(payment, null);
	}


	private static PaymentView build(Payment payment, List<SettlementView> settlements) {
		return new PaymentView(
				payment.getId(),
				payment.getNumber(),
				payment.getCode(),
				payment.getList().getId(),
				payment.getPerson().getId(),
				payment.getPerson().getFullName(),
				payment.getPerson().getName(),
				payment.getPerson().getLastName(),
				payment.getPerson().getEffectivePhone(),
				payment.getChargeKind(),
				payment.getGroup() == null ? null : payment.getGroup().getId(),
				payment.getMembership() == null ? null : payment.getMembership().getId(),
				payment.getDescription(),
				payment.getUnitCost(),
				payment.getQuantity(),
				payment.getGross(),
				payment.getDiscountPercent(),
				payment.getDiscountAmount(),
				payment.getAmountToPay(),
				payment.getAmountSettled(),
				payment.getOutstanding(),
				payment.isSettled(),
				payment.isContractReturned(),
				payment.getNote(),
				settlements
		);
	}
}
