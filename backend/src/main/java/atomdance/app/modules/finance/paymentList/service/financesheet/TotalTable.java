package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import atomdance.app.modules.finance.transaction.dto.TransactionView;
import atomdance.app.modules.finance.transaction.model.TransactionType;
import org.apache.commons.lang3.function.TriConsumer;
import org.dhatim.fastexcel.BorderStyle;
import org.dhatim.fastexcel.Worksheet;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.BG_COLOR_HEADER_BLUE;


public class TotalTable extends FinanceSheetTable<FinanceSheetGenerator.TotalsWithTransactions> {


	protected TotalTable(String listName, Worksheet worksheet, Coordinates coordinates, FinanceSheetGenerator.TotalsWithTransactions sheetContent) {
		super(listName, worksheet, coordinates, sheetContent);
	}


	@Override
	public List<String> getHeaders() {
		return List.of(
				"Płatności", // special header which does not have value by itself
				"Liczba płatności",
				"Liczba rozliczonych płatności",
				"Liczba nierozliczonych płatności",
				"Całkowita kwota do opłacenia na liście",
				"Kwota z wpłat z tego miesiąca przeznaczona na tę listę",
				"Kwota z wpłat z innego miesiąca przeznaczona na tę listę",
				"Brakująca kwota na liście",

				"", // empty to leave gap
				"Wpłaty", // special header which does not have value by itself
				"Suma przyjętych wpłat w tym miesiącu",
				"Suma w przelewie",
				"Suma w gotówce",
				"Suma w BLIK",

				"",
				"Bilans",
				"Suma dodatkowych przychodów",
				"Suma wydatków",
				"Dochód w miesiącu"
		);
	}


	@Override
	protected int getFirstDataRowIndex() {
		return coordinates.getTopLeftColumn() + 1;
	}


	@Override
	protected void styleTable() {
		worksheet.width(coordinates.getTopLeftColumn(), 46);
		worksheet.width(coordinates.getTopLeftColumn() + 1, 15);

		worksheet.range(coordinates.getTopLeftColumn() + 1, 0, 7, 1).style()
				.borderStyle(BorderStyle.THIN)
				.horizontalAlignment("left")
				.set();

		worksheet.range(coordinates.getTopLeftColumn() + 10, 0, 13, 1).style()
				.borderStyle(BorderStyle.THIN)
				.horizontalAlignment("left")
				.set();

		worksheet.range(coordinates.getTopLeftColumn() + 16, 0, 18, 1).style()
				.borderStyle(BorderStyle.THIN)
				.horizontalAlignment("left")
				.set();

		var headersIterator = getHeaders().iterator();
		for (int i = coordinates.getTopLeftColumn(); i <= getHeaders().size() - 1; i++) {
			if (rowIndexIsSpecialHeaderOrGap(i)) { // indices of special headers
				worksheet.style(i, tableRange.getTop())
						.bold()
						.fontSize(12)
						.set();
			} else {
				worksheet.style(i, tableRange.getTop())
						.fillColor(BG_COLOR_HEADER_BLUE)
						.set();
			}

			worksheet.value(i, tableRange.getTop(), headersIterator.next());
		}
	}


	@Override
	protected void fillWorksheetContent() {
		AtomicInteger rowReset = new AtomicInteger(coordinates.getTopLeftRow() + 1); // skip first special header
		var rowToIncrement = new AtomicInteger(rowReset.intValue());

		TriConsumer<TriConsumer<Integer, Integer, String>, Integer, String> insertInWorksheet = (function, c, value) -> {
			function.accept(rowToIncrement.intValue(), c + getFirstDataRowIndex(), value);
			rowToIncrement.incrementAndGet();
		};

		IntStream.range(0, sheetContent.size())
				.forEach(i -> {
					var totals = sheetContent.get(i).totals();
					var transactionViews = sheetContent.get(i).transactionViews();
					var sumIncomeTransactions = sumTransactions(transactionViews, TransactionType.INCOME);
					var sumExpenseTransactions = sumTransactions(transactionViews, TransactionType.EXPENSE);
					insertInWorksheet.accept(worksheet::value, i, Long.toString(totals.rowCount()));
					insertInWorksheet.accept(worksheet::value, i, Long.toString(totals.settledCount()));
					insertInWorksheet.accept(worksheet::value, i, formatUnsettledCount(totals));
					insertInWorksheet.accept(worksheet::value, i, Money.format(totals.billedTotal()));
					insertInWorksheet.accept(worksheet::value, i, Money.format(totals.collectedTotal()));
					insertInWorksheet.accept(worksheet::value, i, Money.format(totals.clearedElsewhereTotal()));
					insertInWorksheet.accept(worksheet::value, i, Money.format(totals.outstandingTotal()));

					rowToIncrement.addAndGet(2); // skip second special header
					insertInWorksheet.accept(worksheet::value, i, formatPaymentMethodSumAndCount(totals.depositsReceivedTotalCount(), totals.depositsReceivedTotal()));
					insertInWorksheet.accept(worksheet::value, i, formatPaymentMethodSumAndCount(totals.depositsReceivedTransferCount(), totals.depositsReceivedTransfer()));
					insertInWorksheet.accept(worksheet::value, i, formatPaymentMethodSumAndCount(totals.depositsReceivedCashCount(), totals.depositsReceivedCash()));
					insertInWorksheet.accept(worksheet::value, i, formatPaymentMethodSumAndCount(totals.depositsReceivedBlikCount(), totals.depositsReceivedBlik()));

					rowToIncrement.addAndGet(2);
					insertInWorksheet.accept(worksheet::value, i, Money.format(sumIncomeTransactions));
					insertInWorksheet.accept(worksheet::value, i, Money.format(sumExpenseTransactions));
					insertInWorksheet.accept(worksheet::value, i, Money.format(totals.depositsReceivedTotal().add(sumIncomeTransactions).subtract(sumExpenseTransactions)));

					rowToIncrement.set(rowReset.intValue());
				});
	}


	private String formatUnsettledCount(ListReportView.Totals totals) {
		return Long.toString(totals.rowCount() - totals.settledCount());
	}


	private String formatPaymentMethodSumAndCount(long count, BigDecimal sum) {
		return Money.format(sum) + " (" + count + ")";
	}


	private boolean rowIndexIsSpecialHeaderOrGap(int i) {
		return i == 0 || i == 8 || i == 9 || i == 14 || i == 15;
	}


	private BigDecimal sumTransactions(List<TransactionView> transactionViews, TransactionType transactionType) {
		return transactionViews.stream()
				.filter(transactionView -> transactionView.type().equals(transactionType))
				.map(TransactionView::amount)
				.reduce(Money.ZERO, Money::add);
	}
}
