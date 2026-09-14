package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.attendance.model.GenResultPayload;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import lombok.RequiredArgsConstructor;
import org.dhatim.fastexcel.Workbook;
import org.dhatim.fastexcel.Worksheet;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class FinanceSheetGenerator {

    private static final String FILENAME_TEMPLATE = "%s.xlsx";
    private final AppClock appClock;

    // ignore warnings related to closing resources
    // wb.close() takes care of everything
    @SuppressWarnings({"java:S2095", "java:S4087"})
    public GenResultPayload generateFinanceSheet(ListReportView lrv) throws IOException {
        try (var outputStream = new ByteArrayOutputStream(); var wb = new Workbook(outputStream, "TestWorkbook", "1.0")) {
            wb.setGlobalDefaultFont("Calibri", 10);
            Worksheet totals = wb.newWorksheet("Podsumowanie");
            Worksheet rows = wb.newWorksheet("Płatności");
            Worksheet deposits = wb.newWorksheet("Wpłaty");

            TotalTable totalTable = new TotalTable(describeList(lrv), totals, Coordinates.getDefaultCoordinates(), lrv.totals());
            totalTable.createWorksheet();

            RowTable rowTable = new RowTable(describeList(lrv), rows, Coordinates.getDefaultCoordinates(), lrv.rows());
            rowTable.createWorksheet();

            DepositTable depositTable = new DepositTable(describeList(lrv), deposits, Coordinates.getDefaultCoordinates(), lrv.cashIn(), appClock);
            depositTable.createWorksheet();

            // TODO dodać nowy worksheet podsumowanie
            // TODO rozwiązać problem z brakiem formatowaniana na ostatnim rzędzie
            // TODO # brakuje w danych pobranych z atomlist

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
}
