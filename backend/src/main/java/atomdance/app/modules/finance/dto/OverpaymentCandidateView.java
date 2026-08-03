package atomdance.app.modules.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * A debt an overpayment could be assigned to.
 */
public record OverpaymentCandidateView(
		UUID listId,
		UUID paymentId,
		int year,
		int month,
		boolean tournamentList,
		BigDecimal outstanding,
		boolean past
) {}
