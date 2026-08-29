package atomdance.app.modules.finance.payment.dto;

import atomdance.app.modules.finance.deposit.model.PaymentMethod;
import atomdance.app.modules.finance.payment.model.PaymentSettlement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;


/**
 * One part of a payment: some of a deposit's money clearing some of a debt.
 *
 * @param carryingMoney     whether this money is reported on the list its payment sits on. {@code false} means
 *                          the debt was cleared out of another month's cash, which is counted there instead.
 * @param depositReceivedAt when that cash arrived - and so, for a clearance, which month does report it.
 */
public record SettlementView(
		UUID id,
		String code,
		UUID paymentId,
		UUID depositId,
		String depositCode,
		BigDecimal amount,
		PaymentMethod paymentMethod,
		Instant settledAt,
		boolean carryingMoney,
		Instant depositReceivedAt
) {

	public static SettlementView from(PaymentSettlement settlement) {
		return new SettlementView(
				settlement.getId(),
				settlement.getCode(),
				settlement.getPayment() == null ? null : settlement.getPayment().getId(),
				settlement.getDeposit() == null ? null : settlement.getDeposit().getId(),
				settlement.getDeposit() == null ? null : settlement.getDeposit().getCode(),
				settlement.getAmount(),
				settlement.getPaymentMethod(),
				settlement.getSettledAt(),
				settlement.isCarryingMoney(),
				settlement.getDeposit() == null ? null : settlement.getDeposit().getReceivedAt()
		);
	}
}
