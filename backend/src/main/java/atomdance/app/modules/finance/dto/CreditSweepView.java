package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;


/**
 * Every bit of leftover credit that could be spent on one list, and what each bit would settle there.
 */
public record CreditSweepView(
		UUID listId,
		BigDecimal creditAvailableTotal,
		BigDecimal allocatedTotal,
		BigDecimal remainingCreditTotal,
		int depositCount,
		int paymentCount,
		List<Entry> entries
) {

	/**
	 * One handover's credit, and the charges on this list it would go against.
	 *
	 * @param creditAvailable what this handover still holds
	 * @param allocated       what of it this sweep would spend
	 * @param remainingCredit what of it would still be waiting afterwards
	 */
	public record Entry(
			UUID depositId,
			String depositCode,
			UUID payerId,
			String payerName,
			PaymentMethod paymentMethod,
			Instant receivedAt,
			Integer bookedYear,
			Integer bookedMonth,
			BigDecimal creditAvailable,
			BigDecimal allocated,
			BigDecimal remainingCredit,
			List<PlannedSettlementView> settlements
	) {}
}
