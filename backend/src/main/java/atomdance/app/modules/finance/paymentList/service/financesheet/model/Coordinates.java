package atomdance.app.modules.finance.paymentList.service.financesheet.model;

import atomdance.app.modules.finance.paymentList.dto.ListReportView;
import lombok.Data;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Data
public class Coordinates {
    private int topLeftRow;
    private int topLeftColumn;

    public Coordinates(int topLeftRow, int topLeftColumn) {
        this.topLeftRow = topLeftRow;
        this.topLeftColumn = topLeftColumn;
    }

    public static Coordinates getDefaultCoordinates() {
        return new Coordinates(0, 0);
    }

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
