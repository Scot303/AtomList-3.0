package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import lombok.RequiredArgsConstructor;
import org.dhatim.fastexcel.BorderStyle;
import org.dhatim.fastexcel.Range;
import org.dhatim.fastexcel.Workbook;
import org.dhatim.fastexcel.Worksheet;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class FinanceSheetGenerator {

    private final AppClock appClock;

    // ignore warnings related to closing resources
    // wb.close() takes care of everything
    @SuppressWarnings({"java:S2095", "java:S4087"})
    public byte[] generateFinanceSheet(ListReportView lrv) throws IOException {
        try (var outputStream = new ByteArrayOutputStream(); var wb = new Workbook(outputStream, "TestWorkbook", "1.0")) {
            Worksheet deposits = wb.newWorksheet("Wpłaty");
            Worksheet rows = wb.newWorksheet("Płatności");
            Worksheet ws1 = wb.newWorksheet("Sheet test1");

            DepositTable depositTable = new DepositTable(deposits, Coordinates.getDefaultCoordinates(), lrv.cashIn(), appClock);
            depositTable.createWorksheet();

            RowTable rowTable = new RowTable(rows, Coordinates.getDefaultCoordinates(), lrv.rows());
            rowTable.createWorksheet();

            // some assumptions on what Deposit columns are needed on the sheet
            List<String> headers = List.of(
                    "depositCode",
                    "coveredPerson", // on lrv it is a list, create new row for each person
                    "paymentMethod",
                    "receivedAt",
                    "direct", // direct/counter
                    "belongsHere",
                    "totalAmount",
                    "countedOnThisList",
                    "clearedOnThisList",
                    "spentElsewhere",
                    "unallocated",
                    "overpaid",
                    "note",
                    "label",
                    "creditLabel"
            );

            var coords  = new Coordinates(10, 0);
            Range range = ws1.range(coords.getTopLeftRow(), 0, 0, headers.size() - 1);
            range.createTable(headers.toArray(new String[0]));
            for (int i = 0; i < range.getRight(); i++) {
                ws1.style(range.getTop(), i).borderStyle(BorderStyle.THICK).borderColor("FF8800").set();
            }
            ws1.style(3, 1).borderStyle(BorderStyle.THICK).borderColor("FF8800").set();
            var row = new AtomicInteger(range.getTop()).addAndGet(1);
            ws1.value(row, 0, lrv.cashIn().get(0).depositCode());
            ws1.value(row, 1, "TEMP");
            ws1.value(row, 2, lrv.cashIn().get(0).paymentMethod().name());
            ws1.value(row, 3, lrv.cashIn().get(0).receivedAt());
            ws1.value(row, 4, lrv.cashIn().get(0).direct());

            AtomicInteger columnReset = new AtomicInteger(coords.getTopLeftColumn());
            var columnToIncrement = new AtomicInteger(columnReset.intValue());
            IntStream.range(1, lrv.cashIn().size())
                            .forEach(i -> {
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).depositCode()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), "TEMP"); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).paymentMethod().name()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).receivedAt()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).direct()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).belongsHere()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).totalAmount()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).countedOnThisList()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).clearedOnThisList()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).spentElsewhere()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).unallocated()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).overpaid()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).note()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).label()); columnToIncrement.incrementAndGet();
                                ws1.value(i + coords.getTopLeftRow(), columnToIncrement.intValue(), lrv.cashIn().get(i).creditLabel()); columnToIncrement.incrementAndGet();
                                columnToIncrement.set(columnReset.intValue());
                            });
            wb.close();

            return outputStream.toByteArray();
        }
    }
}
