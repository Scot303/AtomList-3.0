package atomdance.app.modules.finance.dto;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.service.DepositAllocationPlanner;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * One line of a plan: this much of the money against this debt.
 *
 * @param partial        whether the payment is left still owing afterwards - the row a manager needs to see
 * @param remainingAfter what would still be owed on it once this is applied
 */
public record PlannedSettlementView(
		UUID paymentId,
		String paymentCode,
		UUID listId,
		Integer year,
		Integer month,
		boolean tournamentList,
		boolean listClosed,
		UUID personId,
		String personName,
		String description,
		BigDecimal amountToPay,
		BigDecimal alreadySettled,
		BigDecimal amount,
		BigDecimal remainingAfter,
		boolean partial
) {

	public static PlannedSettlementView from(DepositAllocationPlanner.PlannedSettlement planned) {
		Payment payment = planned.payment();

		return new PlannedSettlementView(
				payment.getId(),
				payment.getCode(),
				payment.getList().getId(),
				payment.getList().getYear(),
				payment.getList().getMonth(),
				payment.getList().isTournament(),
				payment.getList().isClosed(),
				payment.getPerson().getId(),
				payment.getPerson().getFullName(),
				payment.getLabel(),
				payment.getAmountToPay(),
				payment.getAmountSettled(),
				planned.amount(),
				Money.subtract(payment.getOutstanding(), planned.amount()),
				planned.partial()
		);
	}
}
