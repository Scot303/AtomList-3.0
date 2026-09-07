package atomdance.app.modules.finance.paymentList.service.financesheet;


import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.deposit.model.PaymentMethod;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.function.TriConsumer;
import org.dhatim.fastexcel.Worksheet;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

public class DepositTable extends FinanceSheetTable<ListReportView.Deposit> {

    private final AppClock appClock;

    public DepositTable(Worksheet worksheet, Coordinates coordinates, List<ListReportView.Deposit> deposits, AppClock appClock) {
        super(worksheet, coordinates, deposits);
        this.appClock = appClock;
    }

    @Override
    public List<String> getHeaders() {
        return List.of(
                "Etykieta",
                "Wpłacona kwota",
                "Metoda płatności",
                "Data wpłaty",
                "Należy do tego miesiąca"
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
                    putInWorksheet.accept(i, columnToIncrement, sheetContent.get(i).label().substring(8));
                    putInWorksheet.accept(i, columnToIncrement, formatTotalAmountString(sheetContent.get(i)));
                    putInWorksheet.accept(i, columnToIncrement, PaymentMethodTranslate.getTranslation(sheetContent.get(i).paymentMethod()));
                    putInWorksheet.accept(i, columnToIncrement, DateTimeFormatter.ofPattern("dd-MM-yyyy").withZone(appClock.getZone()).format(sheetContent.get(i).receivedAt()));
                    putInWorksheet.accept(i, columnToIncrement, formatBelongsHere(sheetContent.get(i).belongsHere()));
                    columnToIncrement.set(columnReset.intValue());
                });
    }

    private String formatBelongsHere(boolean belongsHere) {
        return belongsHere ? "TAK" : "NIE";
    }

    private String formatTotalAmountString(ListReportView.Deposit deposit) {
        return Money.format(deposit.totalAmount()) + (deposit.overpaid() ? " (nadpłata)" : "");

    }


    @AllArgsConstructor
    protected enum PaymentMethodTranslate {
        TRANSFER(PaymentMethod.TRANSFER, "Przelew"),
        CASH(PaymentMethod.CASH, "Gotówka"),
        BLIK(PaymentMethod.BLIK, "BLIK");

        private PaymentMethod paymentMethod;
        private String plTranslation;

        protected static String getTranslation(PaymentMethod paymentMethod) {
            for (var value : PaymentMethodTranslate.values()) {
                if (value.paymentMethod.equals(paymentMethod)) {
                    return value.plTranslation;
                }
            }
            return null;
        }
    }
}
