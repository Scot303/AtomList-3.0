package atomdance.app.modules.finance.repository.projection;

import java.math.BigDecimal;
import java.util.UUID;


/**
 * One money figure belonging to one list - what it billed, or what it collected.
 */
public record ListAmount(
		UUID listId,
		BigDecimal amount
) {
}
