package atomdance.app.modules.finance.paymentList.service.financesheet;

import lombok.experimental.UtilityClass;

@UtilityClass
public class SheetUtil {
    // colors picked specifically to look distinct in greyscale
    public static final String BG_COLOR_LIGHT = "FFEA00";
    public static final String BG_COLOR_MEDIUM = "873600";
    public static final String BG_COLOR_DARK = "003300";
    public static final String BG_COLOR_HEADER_BLUE = "46E1FC";
    public static final String FONT_COLOR_WHITE = "FFFFFF";
    public static final String FONT_COLOR_BLACK = "000000";

    /**
     * Find 'excel-style' cell address using fastexcel coordinates
     * @param row row index in 0-indexed system used in fastexcel
     * @param column column index in 0-indexed system used in fastexcel
     */
    public static String cellFinder(int row, int column) {
        final var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var columnLetter = ALPHABET.charAt(column);
        return "" + columnLetter + row;
    }

    /**
     * Find 'excel-style' cell address using fastexcel coordinates
     * @param row row index in 0-indexed system used in fastexcel
     * @param rowOffset offset to find address relative to other row index
     * @param column column index in 0-indexed system used in fastexcel
     */
    public static String cellFinder(int row, int rowOffset, int column) {
        return cellFinder(row + rowOffset, column);
    }
}
