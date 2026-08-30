package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import lombok.RequiredArgsConstructor;
import org.dhatim.fastexcel.Range;
import org.dhatim.fastexcel.Workbook;
import org.dhatim.fastexcel.Worksheet;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
public class FinanceSheetGenerator {

    // wb.close() takes care of closing all files
    @SuppressWarnings("java:S2095")
    public byte[] generateFinanceSheet(ListReportView lrv) throws IOException {
        try (var outputStream = new ByteArrayOutputStream(); var wb = new Workbook(outputStream, "TestWorkbook", "1.0")) {
            Worksheet ws = wb.newWorksheet("Sheet 1");
            Worksheet ws2 = wb.newWorksheet("Sheet 2");

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

//            ws.range(10, 0, 12, .createTable(headers.toArray(new String[0]));

            var coords  = new Coordinates(10, 0);
            Range range = ws.range(coords.topLeftRow, 0, coords.getBottomCorner(lrv.cashIn()), headers.size() - 1);
            range.createTable(headers.toArray(new String[0]))
                    .setDisplayName("TableDisplayName")
                    .setName("TableName")
                    .styleInfo()
                    .setStyleName("TableStylMedium1");
            var row = new AtomicInteger(range.getTop()).addAndGet(1);
            ws.value(row, 0, lrv.cashIn().get(0).depositCode());
            ws.value(row, 1, "TEMP");
            ws.value(row, 2, lrv.cashIn().get(0).paymentMethod().name());
            ws.value(row, 3, lrv.cashIn().get(0).receivedAt());
            ws.value(row, 4, lrv.cashIn().get(0).direct());


//            IntStream.range(1, lrv.cashIn().size() - 1)
//                            .forEach(i -> {
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).depositCode()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), "TEMP"); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).paymentMethod().name()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).receivedAt()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).direct()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).belongsHere()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).totalAmount()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).countedOnThisList()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).clearedOnThisList()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).spentElsewhere()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).unallocated()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).overpaid()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).note()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).label()); column.incrementAndGet();
//                                ws.value(i + coords.topLeftRow, column.intValue(), lrv.cashIn().get(i).creditLabel()); column.incrementAndGet();
//                            });

            ws2.value(0, 0, "This is a string in A2");
            ws2.value(0, 1, LocalDate.now());
            ws2.value(0, 2, 1234);
            ws2.value(0, 3, 123456L);
            ws2.value(0, 4, 1.234);
            wb.close();

            return outputStream.toByteArray();
        }
    }


    private record Coordinates(int topLeftRow, int topLeftColumn) {

        public int getBottomCorner(List<ListReportView.Deposit> deposits) {
            AtomicInteger numOfRows = new AtomicInteger(topLeftRow + 1);
            deposits.forEach(d -> {
                numOfRows.incrementAndGet();
                numOfRows.addAndGet(d.coveredPersons().size());
            });

            System.out.println("last row: " + numOfRows.intValue());
            return numOfRows.intValue();
        }
    }

}
