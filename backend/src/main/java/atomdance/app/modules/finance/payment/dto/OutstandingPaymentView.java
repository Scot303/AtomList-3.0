package atomdance.app.modules.finance.payment.dto;

import atomdance.app.modules.finance.payment.model.Payment;

import java.math.BigDecimal;
import java.util.UUID;


/**
 * One charge somebody has not finished paying, with the sheet it sits on.
 *
 * @param outstanding what is still owed on it, which is what makes this an arrear.
 */
public record OutstandingPaymentView(
		UUID paymentId,
		String paymentCode,
		UUID listId,
		Integer year,
		Integer month,
		boolean tournamentList,
		String listName,
		boolean listClosed,
		UUID groupId,
		String description,
		BigDecimal amountToPay,
		BigDecimal amountSettled,
		BigDecimal outstanding
) {

	public static OutstandingPaymentView from(Payment payment) {
		return new OutstandingPaymentView(
				payment.getId(),
				payment.getCode(),
				payment.getList().getId(),
				payment.getList().getYear(),
				payment.getList().getMonth(),
				payment.getList().isTournament(),
				payment.getList().getName(),
				payment.getList().isClosed(),
				payment.getGroup() == null ? null : payment.getGroup().getId(),
				payment.getLabel(),
				payment.getAmountToPay(),
				payment.getAmountSettled(),
				payment.getOutstanding()
		);
	}
}
