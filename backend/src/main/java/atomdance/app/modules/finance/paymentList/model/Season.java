package atomdance.app.modules.finance.paymentList.model;

import java.time.Month;
import java.time.YearMonth;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.IntStream;


/**
 * The dance studio year.
 */
public final class Season {

	public static final int START_MONTH = 9;

	public static final int MONTHS = 12;

	/**
	 * A monthly sheet for off-season months starts empty.
	 */
	private static final Set<Month> OFF_SEASON = Collections.unmodifiableSet(EnumSet.of(Month.JULY, Month.AUGUST));


	private Season() {
	}


	public static boolean isOffSeason(YearMonth month) {
		return month != null && OFF_SEASON.contains(month.getMonth());
	}


	/**
	 * The twelve months of one season, in the order they happen.
	 */
	public static List<YearMonth> months(int startYear) {
		YearMonth first = YearMonth.of(startYear, START_MONTH);

		return IntStream.range(0, MONTHS).mapToObj(first::plusMonths).toList();
	}
}
