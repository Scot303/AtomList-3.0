package atomdance.app.modules.finance.repository.projection;

import java.util.UUID;

/**
 * How many rows one list holds, and how many of them are dealt with.
 */
public record PaymentCounts(
		UUID listId,
		Long totalCount,
		Long settledCount
) {
}
