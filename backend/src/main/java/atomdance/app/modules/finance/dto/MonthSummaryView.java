package atomdance.app.modules.finance.dto;

import java.math.BigDecimal;


/**
 * One month of the year overview.
 *
 * @param collectedTotal        what the month's sheets actually took in - settlements whose money is booked to this month.
 *                              Not {@code billed - outstanding}: a debt cleared out of a later month's cash is neither owing here nor income here.
 * @param clearedElsewhereTotal debts on this month settled out of another month's cash, and reported as income there.
 *                              This is the gap that makes the other three add up: {@code billed = collected + clearedElsewhere + outstanding}.
 * @param outstandingTotal      what the month is still owed.
 * @param expenseTotal          hand-recorded expenses, or {@code null} when the caller may not read them - which is
 *                              not the same as zero and must not be shown as one.
 * @param incomeTotal           hand-recorded income, on the same terms. Deposits are not transactions and are not
 *                              counted here; {@link #collectedTotal} is what people paid.
 */
public record MonthSummaryView(
		int year,
		int month,
		ListSummaryView tournament,
		ListSummaryView open,
		BigDecimal billedTotal,
		BigDecimal collectedTotal,
		BigDecimal clearedElsewhereTotal,
		BigDecimal outstandingTotal,
		BigDecimal expenseTotal,
		BigDecimal incomeTotal
) {
}
