package atomdance.app.modules.finance.paymentList.service.financesheet.model;

import lombok.Data;


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
}
