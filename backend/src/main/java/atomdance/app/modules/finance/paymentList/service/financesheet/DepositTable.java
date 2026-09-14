package atomdance.app.modules.finance.paymentList.service.financesheet;


import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.model.financesheet.PaymentMethodTranslate;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import lombok.EqualsAndHashCode;
import org.apache.commons.lang3.function.TriConsumer;
import org.dhatim.fastexcel.ConditionalFormattingExpressionRule;
import org.dhatim.fastexcel.Worksheet;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.BG_COLOR_MEDIUM;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.FONT_COLOR_WHITE;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.cellFinder;

@EqualsAndHashCode(callSuper = true)
public class DepositTable extends FinanceSheetTable<ListReportView.Deposit> {

    private final AppClock appClock;

    public DepositTable(String listName, Worksheet worksheet, Coordinates coordinates, List<ListReportView.Deposit> deposits, AppClock appClock) {
        super(listName, worksheet, coordinates, deposits, false);
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
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Należy do tego miesiąca"), 22.0);
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
                    var deposit = sheetContent.get(i);
                    worksheet.style(i, columnToIncrement.intValue()).format("@");
                    insertInWorksheet.accept(worksheet::value, i, deposit.label().substring(8));
                    insertInWorksheet.accept(worksheet::value, i, formatTotalAmountString(deposit));
                    insertInWorksheet.accept(worksheet::value, i, PaymentMethodTranslate.getTranslation(deposit.paymentMethod()));
                    insertInWorksheet.accept(worksheet::value, i, DateTimeFormatter.ofPattern("dd-MM-yyyy").withZone(appClock.getZone()).format(deposit.receivedAt()));
                    formatBelongsHereCell(i, columnToIncrement.intValue());
                    insertInWorksheet.accept(worksheet::value, i, formatBelongsHere(deposit.belongsHere()));

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
        worksheet.style(row, column).fillColor(BG_COLOR_MEDIUM).fontColor(FONT_COLOR_WHITE).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"TAK\"", true));
    }
}
