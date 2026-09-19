package atomdance.app.modules.finance.deposit.model;

import atomdance.app.common.utils.SpokenCode;

import java.util.Optional;


public final class DepositCode {

	public static final String PREFIX = "W-";
	public static final String YEAR_SEPARATOR = "/";


	private DepositCode() {
	}


	/**
	 * @return the code for a saved deposit, or {@code null} for one not numbered yet
	 */
	public static String format(Long number, Integer year) {
		if (number == null || year == null) {
			return null;
		}

		return SpokenCode.format(PREFIX, number) + YEAR_SEPARATOR + String.format("%02d", Math.floorMod(year, 100));
	}


	/**
	 * Reads back what somebody actually types: "W-1234/26", "w-1234/2026", a bare "1234/26", or any of those without a year at all.
	 */
	public static Optional<Ref> parse(String code) {
		return SpokenCode.parse(PREFIX, YEAR_SEPARATOR, code)
				.map(number -> new Ref(number, yearIn(code)));
	}


	/**
	 * One deposit's code, taken apart.
	 *
	 * @param year {@code null} where the code said nothing about a year
	 */
	public record Ref(long number, Integer year) {
	}


	/**
	 * Reads the year half, taking two digits as this century: "26" is 2026.
	 */
	private static Integer yearIn(String code) {
		int separator = code.indexOf(YEAR_SEPARATOR);

		if (separator < 0) {
			return null;
		}

		String digits = code.substring(separator + YEAR_SEPARATOR.length()).trim();

		try {
			int year = Integer.parseInt(digits);

			return digits.length() <= 2 ? 2000 + year : year;
		} catch (NumberFormatException e) {
			return null;
		}
	}
}
