package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentSettlement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;


/**
 * What one deposit settled, seen from the money's side: which person, which group, which month.
 *
 * @param carryingMoney whether this counted as income on the list it landed on. {@code false} means it cleared
 *                      a debt there and is reported as income in the deposit's own month instead.
 */
public record DepositSettlementView(
		UUID id,
		String code,
		BigDecimal amount,
		Instant settledAt,
		boolean carryingMoney,
		UUID paymentId,
		String paymentCode,
		UUID listId,
		Integer year,
		Integer month,
		boolean tournamentList,
		String listName,
		UUID personId,
		String personName,
		UUID groupId,
		String description
) {

	public static DepositSettlementView from(PaymentSettlement settlement) {
		Payment payment = settlement.getPayment();

		return new DepositSettlementView(
				settlement.getId(),
				settlement.getCode(),
				settlement.getAmount(),
				settlement.getSettledAt(),
				settlement.isCarryingMoney(),
				payment.getId(),
				payment.getCode(),
				payment.getList().getId(),
				payment.getList().getYear(),
				payment.getList().getMonth(),
				payment.getList().isTournament(),
				payment.getList().getName(),
				payment.getPerson().getId(),
				payment.getPerson().getFullName(),
				payment.getGroup() == null ? null : payment.getGroup().getId(),
				payment.getLabel()
		);
	}
}
