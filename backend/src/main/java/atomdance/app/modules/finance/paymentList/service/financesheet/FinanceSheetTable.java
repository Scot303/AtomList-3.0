package atomdance.app.modules.finance.paymentList.service.financesheet;

import atomdance.app.modules.finance.paymentList.service.financesheet.model.Coordinates;
import lombok.Data;
import org.dhatim.fastexcel.BorderStyle;
import org.dhatim.fastexcel.Range;
import org.dhatim.fastexcel.Worksheet;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Data
public abstract class FinanceSheetTable<T> {

    protected final Worksheet worksheet;
    protected final Coordinates coordinates;
    protected final List<T> sheetContent;
    protected final Range tableRange;

    protected FinanceSheetTable(Worksheet worksheet, Coordinates coordinates, List<T> sheetContent) {
        this.worksheet = worksheet;
        this.coordinates = coordinates;
        this.sheetContent = sheetContent;
        this.tableRange = worksheet.range(coordinates.getTopLeftRow(), 0, getTableBottomRow(), getHeaders().size() - 1);
    }

    public abstract List<String> getHeaders();
    /**
     * Implemented by extending classes. Describes how {@link #sheetContent} fills the {@link #worksheet}.
     */
    protected abstract void fillWorksheetContent();

    protected int getTableBottomRow() {
        AtomicInteger numOfRows = new AtomicInteger(coordinates.getTopLeftRow());
        sheetContent.forEach(d -> numOfRows.incrementAndGet());
        return numOfRows.intValue();
    }

    protected int getFirstDataRowIndex() {
        return coordinates.getTopLeftRow() + 1;
    }

    /**
     * Public method to style and populate the worksheet with data.
     * Calls methods to be implemented by classes extending {@link FinanceSheetTable},
     * or uses default implementations if available.
     */
    public void createWorksheet() {
        styleTable();
        fillWorksheetContent();
    }

    /**
     * Styles the data table within worksheet. Can be overridden by extending classes.
     */
    protected void styleTable() {
        // arguably should be in fillWorksheetContent
        // but styling seems to have to happen after filling cells with data
        tableRange.createTable(getHeaders().toArray(new String[0]));

        tableRange.style()
                .borderStyle(BorderStyle.THIN)
                .wrapText(true)
                .horizontalAlignment("left").set();

        // default styling of header row in table
        for (int i = 0; i <= tableRange.getRight(); i++) {
            worksheet
                    .style(tableRange.getTop(), i)
                    .fillColor("46E1FC").set();
        }
    }

    protected int getHeaderColumnIndex(String header) {
        return getHeaders().indexOf(header);
    }
}
