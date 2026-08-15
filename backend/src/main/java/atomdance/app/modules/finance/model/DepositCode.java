package atomdance.app.modules.finance.model;

import java.util.Optional;


public final class DepositCode {

	public static final String PREFIX = "D-";


	private DepositCode() {
	}


	/**
	 * @return the code for a saved deposit, or {@code null} for one the database has not numbered yet
	 */
	public static String format(Long number) {
		return SpokenCode.format(PREFIX, number);
	}


	/**
	 * Reads back what somebody actually types: "D-1234", "d-1234", a bare "1234", any of them padded with spaces.
	 */
	public static Optional<Long> parse(String code) {
		return SpokenCode.parse(PREFIX, null, code);
	}
}
