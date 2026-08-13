package atomdance.app.modules.finance.repository.projection;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * What one list is genuinely still owed.
 */
public record PaymentOutstanding(
		UUID listId,
		BigDecimal outstanding
) {
}
