package atomdance.app.modules.finance.paymentList.dto;

import java.util.UUID;


/**
 * One list as the year overview needs it.
 */
public record ListSummaryView(
		UUID id,
		boolean closed,
		long settledCount,
		long totalCount
) {
}
