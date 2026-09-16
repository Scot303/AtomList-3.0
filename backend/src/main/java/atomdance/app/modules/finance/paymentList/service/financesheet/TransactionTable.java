package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.paymentList.model.financesheet.TransactionTypeTranslate;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import atomdance.app.modules.finance.transaction.dto.TransactionView;
import org.apache.commons.lang3.function.TriConsumer;
import org.dhatim.fastexcel.ConditionalFormattingExpressionRule;
import org.dhatim.fastexcel.Worksheet;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.BG_COLOR_LIGHT;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.BG_COLOR_MEDIUM;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.FONT_COLOR_BLACK;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.FONT_COLOR_WHITE;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.cellFinder;

public class TransactionTable extends FinanceSheetTable<TransactionView> {

    protected TransactionTable(String listName, Worksheet worksheet, Coordinates coordinates, List<TransactionView> sheetContent) {
        super(listName, worksheet, coordinates, sheetContent);
    }

    @Override
    public List<String> getHeaders() {
        return List.of(
                "Nazwa",
                "Kwota",
                "Ilość",
                "Razem",
                "Rodzaj",
                "Nr. faktury",
                "Data",
                "Instruktor",
                "Opis"
        );
    }

    @Override
    protected void fillWorksheetContent() {
        AtomicInteger columnReset = new AtomicInteger(coordinates.getTopLeftColumn());
        var columnToIncrement = new AtomicInteger(columnReset.intValue());

        TriConsumer<TriConsumer<Integer, Integer, String>, Integer, String> insertInWorksheet = (function, r, value) -> {
            function.accept(r + getFirstDataRowIndex(), columnToIncrement.intValue(), value);
            columnToIncrement.incrementAndGet();
        };

        IntStream.range(0, sheetContent.size())
                .forEach(i -> {
                    var transactionView = sheetContent.get(i);
                    insertInWorksheet.accept(worksheet::value, i, transactionView.name());
                    insertInWorksheet.accept(worksheet::value, i, Money.format(transactionView.amount()));
                    insertInWorksheet.accept(worksheet::value, i, transactionView.quantity().toPlainString());
                    insertInWorksheet.accept(worksheet::value, i, Money.format(transactionView.total()));
                    formatTransactionType(i, columnToIncrement.intValue());
                    insertInWorksheet.accept(worksheet::value, i, TransactionTypeTranslate.getTranslation(transactionView.type()));
                    insertInWorksheet.accept(worksheet::value, i, transactionView.invoiceNumber());
                    insertInWorksheet.accept(worksheet::value, i, transactionView.paymentDate().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")));
                    insertInWorksheet.accept(worksheet::value, i, transactionView.instructorName());
                    insertInWorksheet.accept(worksheet::value, i, transactionView.note());

                    columnToIncrement.set(columnReset.intValue());
                });
    }

    private void formatTransactionType(int row, int column) {
        worksheet.style(row + getFirstDataRowIndex(), column).fillColor(BG_COLOR_LIGHT).fontColor(FONT_COLOR_BLACK).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Wydatek\"", false));
        worksheet.style(row + getFirstDataRowIndex(), column).fillColor(BG_COLOR_MEDIUM).fontColor(FONT_COLOR_WHITE).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Przychód\"", false));
    }
}
