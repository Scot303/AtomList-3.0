package atomdance.app.modules.finance.dto;

import java.math.BigDecimal;

/**
 * One month of the year overview.
 */
public record MonthSummaryView(
		int year,
		int month,
		ListSummaryView tournament,
		ListSummaryView open,
		BigDecimal outstandingTotal,
		BigDecimal expenseTotal,
		BigDecimal incomeTotal
) {
}
