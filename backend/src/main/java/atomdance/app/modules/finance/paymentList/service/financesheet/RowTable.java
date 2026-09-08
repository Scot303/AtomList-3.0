package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.model.financesheet.PaymentChargeKindTranslate;
import atomdance.app.modules.finance.paymentList.model.financesheet.PaymentMethodTranslate;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import org.apache.commons.lang3.function.TriConsumer;
import org.dhatim.fastexcel.ConditionalFormattingExpressionRule;
import org.dhatim.fastexcel.Worksheet;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.COLOR_DARK;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.COLOR_LIGHT;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.COLOR_MEDIUM;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.cellFinder;

public class RowTable extends FinanceSheetTable<ListReportView.Row> {

    public RowTable(Worksheet worksheet, Coordinates coordinates, List<ListReportView.Row> rows) {
        super(worksheet, coordinates, rows);
    }

    @Override
    public List<String> getHeaders() {
        return List.of(
                "Imię, nazwisko",
                "Grupa",
                "Opis",
                "Do zapłaty",
                "Opłacone",
                "Pozostało",
                "Status",
                "Wpłaty"
        );
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
                    insertInWorksheet.accept(worksheet::value, i, sheetContent.get(i).personName());
                    insertInWorksheet.accept(worksheet::value, i, sheetContent.get(i).description());
                    insertInWorksheet.accept(worksheet::value, i, PaymentChargeKindTranslate.getTranslation(sheetContent.get(i).chargeKind()));
                    insertInWorksheet.accept(worksheet::value, i, Money.format(sheetContent.get(i).amountToPay()));
                    insertInWorksheet.accept(worksheet::value, i, Money.format(sheetContent.get(i).amountSettled()));
                    insertInWorksheet.accept(worksheet::value, i, Money.format(sheetContent.get(i).outstanding()));
                    formatStatusCell(i, columnToIncrement.intValue());
                    insertInWorksheet.accept(worksheet::value, i, formatSettled(sheetContent.get(i)));

                    sheetContent.get(i).parts().forEach(
                            p -> insertInWorksheet.accept(worksheet::formula, i, "HYPERLINK(\"#'Wpłaty'!A" + (p.depositRef() + 1) + "\",\"" + (p.depositCode() + " (" + Money.format(p.amount()) + " " + PaymentMethodTranslate.getTranslation(p.paymentMethod())) + ")" + "\")"));
                    columnToIncrement.set(columnReset.intValue());
                });
    }

    private String formatSettled(ListReportView.Row row) {
        var hasOutstandingPayment = row.outstanding().compareTo(BigDecimal.ZERO) > 0;
        var hasSomeAmountSettled = row.amountSettled().compareTo(BigDecimal.ZERO) > 0;

        if (row.settled()) {
            return "Opłacono";
        } else {
            if (hasSomeAmountSettled && hasOutstandingPayment) {
                return "Opłacono częściowo";
            }
        }

        return "Nie opłacono";
    }

    private void formatStatusCell(int row, int column) {
        worksheet.style(row, column).fillColor(COLOR_LIGHT).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Opłacono częściowo\"", true));
        worksheet.style(row, column).fillColor(COLOR_MEDIUM).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Opłacono\"", true));
        worksheet.style(row, column).fillColor(COLOR_DARK).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Nie opłacono\"", true));
    }
}
