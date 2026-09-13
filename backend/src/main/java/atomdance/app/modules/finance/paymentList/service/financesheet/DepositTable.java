package atomdance.app.modules.finance.paymentList.service.financesheet;


import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.model.financesheet.PaymentMethodTranslate;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import org.apache.commons.lang3.function.TriConsumer;
import org.dhatim.fastexcel.ConditionalFormattingExpressionRule;
import org.dhatim.fastexcel.Worksheet;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.COLOR_MEDIUM;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.cellFinder;

public class DepositTable extends FinanceSheetTable<ListReportView.Deposit> {

    private final AppClock appClock;

    public DepositTable(String listName, Worksheet worksheet, Coordinates coordinates, List<ListReportView.Deposit> deposits, AppClock appClock) {
        super(listName, worksheet, coordinates, deposits);
        this.appClock = appClock;
    }

    @Override
    public List<String> getHeaders() {
        return List.of(
                "Wpłata",
                "Wpłacona kwota",
                "Metoda płatności",
                "Data wpłaty",
                "Należy do tego miesiąca"
        );
    }

    @Override
    protected void styleTable() {
        super.styleTable();
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Należy do tego miesiąca"), 20.0);
    }

    @Override
    public void fillWorksheetContent() {
        AtomicInteger columnReset = new AtomicInteger(coordinates.getTopLeftColumn());
        var columnToIncrement = new AtomicInteger(columnReset.intValue());

        TriConsumer<TriConsumer<Integer, Integer, String>, Integer, String> insertInWorksheet = (function, r, value) -> {
            function.accept(r + getFirstDataRowIndex(), columnToIncrement.intValue(), value);
            columnToIncrement.incrementAndGet();
        };

        IntStream.range(0, sheetContent.size())
                .forEach(i -> {
                    insertInWorksheet.accept(worksheet::value, i, sheetContent.get(i).label().substring(8));
                    insertInWorksheet.accept(worksheet::value, i, formatTotalAmountString(sheetContent.get(i)));
                    insertInWorksheet.accept(worksheet::value, i, PaymentMethodTranslate.getTranslation(sheetContent.get(i).paymentMethod()));
                    insertInWorksheet.accept(worksheet::value, i, DateTimeFormatter.ofPattern("dd-MM-yyyy").withZone(appClock.getZone()).format(sheetContent.get(i).receivedAt()));
                    formatBelongsHereCell(i, columnToIncrement.intValue());
                    insertInWorksheet.accept(worksheet::value, i, formatBelongsHere(sheetContent.get(i).belongsHere()));

                    columnToIncrement.set(columnReset.intValue());
                });
    }

    private String formatBelongsHere(boolean belongsHere) {
        return belongsHere ? "TAK" : "NIE";
    }

    private String formatTotalAmountString(ListReportView.Deposit deposit) {
        return Money.format(deposit.totalAmount()) + (deposit.overpaid() ? " (nadpłata)" : "");
    }

    private void formatBelongsHereCell(int row, int column) {
        worksheet.style(row, column).fillColor(COLOR_MEDIUM).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"TAK\"", true));
    }
}
