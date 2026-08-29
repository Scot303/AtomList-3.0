package atomdance.app.modules.finance.deposit.dto;

import java.math.BigDecimal;


/**
 * What a credit sweep actually did, for the message shown once the plan has left the screen.
 *
 * @param depositCount         how many handovers moved
 * @param paymentCount         how many charges were settled, wholly or partly
 * @param allocatedTotal       what was spent
 * @param remainingCreditTotal what is still credit, because the list did not owe enough to absorb it
 */
public record CreditSweepResultView(
		int depositCount,
		int paymentCount,
		BigDecimal allocatedTotal,
		BigDecimal remainingCreditTotal
) {}
