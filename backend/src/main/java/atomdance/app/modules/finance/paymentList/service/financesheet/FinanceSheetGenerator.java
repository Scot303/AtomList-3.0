package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.attendance.model.GenResultPayload;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import atomdance.app.modules.finance.transaction.dto.TransactionView;
import lombok.RequiredArgsConstructor;
import org.dhatim.fastexcel.Workbook;
import org.dhatim.fastexcel.Worksheet;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;


// ignore warnings related to closing resources
// wb.close() takes care of everything
@SuppressWarnings({"java:S2095", "java:S4087"})
@Component
@RequiredArgsConstructor
public class FinanceSheetGenerator {

    private static final String FILENAME_TEMPLATE = "%s.xlsx";
    private final AppClock appClock;

    public GenResultPayload generatePaymentListFullReport(ListReportView lrv, List<TransactionView> transactionViews) throws IOException {
        try (var outputStream = new ByteArrayOutputStream(); var wb = getNewWorkbook(outputStream, "PaymentListWorkbook")) {
            Worksheet totals = wb.newWorksheet("Podsumowanie");
            Worksheet rows = wb.newWorksheet("Płatności");
            Worksheet deposits = wb.newWorksheet("Wpłaty");
            Worksheet transactions = wb.newWorksheet("Transakcje");

            TotalTable totalTable = new TotalTable(describeList(lrv), totals, Coordinates.getDefaultCoordinates(), new TotalsWithTransactions(lrv.totals(), transactionViews));
            totalTable.createWorksheet();

            RowTable rowTable = new RowTable(describeList(lrv), rows, Coordinates.getDefaultCoordinates(), lrv.rows());
            rowTable.createWorksheet();

            DepositTable depositTable = new DepositTable(describeList(lrv), deposits, Coordinates.getDefaultCoordinates(), lrv.cashIn(), appClock);
            depositTable.createWorksheet();

            TransactionTable transactionTable = new TransactionTable(describeList(lrv), transactions, Coordinates.getDefaultCoordinates(), transactionViews);
            transactionTable.createWorksheet();

            wb.close();

            var fileName = FILENAME_TEMPLATE.formatted(
                    lrv.label().replace(" ", "_"));
            return new GenResultPayload(fileName, outputStream.toByteArray());
        }
    }

    private static String describeList(ListReportView list) {
        if (list.type().isStandard() && (list.month() != null && list.year() != null)) {
            return list.type().isTournament() ? list.month() + "-" + list.year() + " (Turniejowa)" : list.month() + "-" + list.year() ;
        }

        return list.name() != null ? "'" + list.name() + "'" : "Lista";
    }

    private Workbook getNewWorkbook(OutputStream os, String workbookName) {
        Workbook wb = new Workbook(os, workbookName, "1.0");
        wb.setGlobalDefaultFont("Calibri", 10);
        return wb;
    }

    protected record TotalsWithTransactions(ListReportView.Totals totals, List<TransactionView> transactionViews) {}
}
