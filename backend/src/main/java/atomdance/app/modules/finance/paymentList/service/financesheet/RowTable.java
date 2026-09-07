package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.deposit.model.PaymentMethod;
import atomdance.app.modules.finance.payment.model.PaymentChargeKind;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.function.TriConsumer;
import org.dhatim.fastexcel.Worksheet;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

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

        TriConsumer<Integer, AtomicInteger, String> putInWorksheet = (r, c, value) -> {
            worksheet.value(r + coordinates.getTopLeftRow(), c.intValue(), value);
            columnToIncrement.incrementAndGet();
        };

        IntStream.range(getFirstDataRowIndex(), sheetContent.size())
                .forEach(i -> {
                    putInWorksheet.accept(i, columnToIncrement, sheetContent.get(i).personName());
                    putInWorksheet.accept(i, columnToIncrement, sheetContent.get(i).description());
                    putInWorksheet.accept(i, columnToIncrement, PaymentChargeKindTranslate.getTranslation(sheetContent.get(i).chargeKind()));
                    putInWorksheet.accept(i, columnToIncrement, formatAmountString(sheetContent.get(i).amountToPay()));
                    putInWorksheet.accept(i, columnToIncrement, formatAmountString(sheetContent.get(i).amountSettled()));
                    putInWorksheet.accept(i, columnToIncrement, formatAmountString(sheetContent.get(i).outstanding()));
                    putInWorksheet.accept(i, columnToIncrement, formatSettled(sheetContent.get(i)));
                    columnToIncrement.set(columnReset.intValue());
                });
    }

    private String formatAmountString(BigDecimal bd) {
        return Money.format(bd);
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

    @AllArgsConstructor
    protected enum PaymentChargeKindTranslate {
        MEMBERSHIP_MONTHLY(PaymentChargeKind.MEMBERSHIP_MONTHLY, "Opłata miesięczna"),
        MEMBERSHIP_PER_CLASS(PaymentChargeKind.MEMBERSHIP_PER_CLASS, "Opłata od liczby wejść na zajęcia"),
        ONE_TIME(PaymentChargeKind.ONE_TIME, "Jednorazowo");

        private PaymentChargeKind paymentChargeKind;
        private String plTranslation;

        protected static String getTranslation(PaymentChargeKind paymentChargeKind) {
            for (var value : RowTable.PaymentChargeKindTranslate.values()) {
                if (value.paymentChargeKind.equals(paymentChargeKind)) {
                    return value.plTranslation;
                }
            }
            return null;
        }
    }
}
