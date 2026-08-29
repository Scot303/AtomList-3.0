package atomdance.app.modules.finance.paymentList.repository.projection;

import atomdance.app.modules.finance.transaction.model.TransactionType;

import java.math.BigDecimal;
import java.util.UUID;


/**
 * One list's income or expense side, summed.
 */
public record TransactionTotals(
		UUID listId,
		TransactionType type,
		BigDecimal total
) {
}
