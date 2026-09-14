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

import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.BG_COLOR_DARK;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.BG_COLOR_LIGHT;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.BG_COLOR_MEDIUM;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.FONT_COLOR_BLACK;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.FONT_COLOR_WHITE;
import static atomdance.app.modules.finance.paymentList.service.financesheet.SheetUtil.cellFinder;

public class RowTable extends FinanceSheetTable<ListReportView.Row> {

    public RowTable(String listName, Worksheet worksheet, Coordinates coordinates, List<ListReportView.Row> rows) {
        super(listName, worksheet, coordinates, rows, false);
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
    protected void styleTable() {
        super.styleTable();
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Imię, nazwisko"), 25);
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Do zapłaty"), 11.5);
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Opłacone"), 11.5);
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Pozostało"), 11.5);
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Opis"), 16);
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Status"), 11.5);
        worksheet.width(coordinates.getTopLeftColumn() + getHeaderColumnIndex("Wpłaty"), 25);
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
                    var row = sheetContent.get(i);
                    insertInWorksheet.accept(worksheet::value, i, row.personName());
                    insertInWorksheet.accept(worksheet::value, i, row.description());
                    insertInWorksheet.accept(worksheet::value, i, PaymentChargeKindTranslate.getTranslation(row.chargeKind()));
                    insertInWorksheet.accept(worksheet::value, i, Money.format(row.amountToPay()));
                    insertInWorksheet.accept(worksheet::value, i, Money.format(row.amountSettled()));
                    insertInWorksheet.accept(worksheet::value, i, Money.format(row.outstanding()));
                    formatStatusCell(i, columnToIncrement.intValue());
                    insertInWorksheet.accept(worksheet::value, i, formatSettled(row));
                    insertInWorksheet.accept(worksheet::value, i, formatRowParts(row.parts()));

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
                return "Częściowo";
            }
        }

        return "Nie opłacono";
    }

    private void formatStatusCell(int row, int column) {
        worksheet.style(row, column).fillColor(BG_COLOR_LIGHT).fontColor(FONT_COLOR_BLACK).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Częściowo\"", true));
        worksheet.style(row, column).fillColor(BG_COLOR_DARK).fontColor(FONT_COLOR_WHITE).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Opłacono\"", true));
        worksheet.style(row, column).fillColor(BG_COLOR_MEDIUM).fontColor(FONT_COLOR_WHITE).set(new ConditionalFormattingExpressionRule(cellFinder(row, getFirstDataRowIndex(), column) + "=\"Nie opłacono\"", true));
    }

    private String formatRowParts(List<ListReportView.Part> parts) {
        StringBuilder sb = new StringBuilder();
        var partsIterator = parts.iterator();
        while (partsIterator.hasNext()) {
            var part = partsIterator.next();
            sb.append("#")
                    .append(part.depositRef())
                    .append(" (")
                    .append(Money.format(part.amount()))
                    .append(" ")
                    .append(PaymentMethodTranslate.getTranslation(part.paymentMethod()))
                    .append(")");

            if ( partsIterator.hasNext() ) {
                sb.append("\r\n");
            }
        }

        return sb.toString();
    }
}
