package atomdance.app.modules.finance.model;

import java.util.Optional;

/**
 * The spoken form of {@link Payment#getNumber()}: "P-1234".
 */
public final class PaymentCode {

	public static final String PREFIX = "P-";

	/**
	 * Separates a payment from one of its charges: "P-1234/5678".
	 */
	public static final String LINE_SEPARATOR = "/";


	private PaymentCode() {
	}


	/**
	 * @return the code for a saved payment, or {@code null} for one the database has not numbered yet
	 */
	public static String format(Long number) {
		if (number == null) {
			return null;
		}

		return PREFIX + number;
	}

	/**
	 * Names one charge: its payment's code, then the charge's own number - "P-1234/5678".
	 */
	public static String formatLine(String paymentCode, Long number) {
		if (paymentCode == null || number == null) {
			return null;
		}

		return paymentCode + LINE_SEPARATOR + number;
	}

	/**
	 * Reads back what somebody actually types: "P-1234", "p-1234", a bare "1234", any of them padded with spaces. Anything else is not a payment code.
	 */
	public static Optional<Long> parse(String code) {
		if (code == null) {
			return Optional.empty();
		}

		String digits = code.trim();
		int line = digits.indexOf(LINE_SEPARATOR);

		if (line >= 0) {
			digits = digits.substring(0, line).trim();
		}

		if (digits.regionMatches(true, 0, PREFIX, 0, PREFIX.length())) {
			digits = digits.substring(PREFIX.length()).trim();
		}

		try {
			long number = Long.parseLong(digits);
			return number < 1 ? Optional.empty() : Optional.of(number);
		} catch (NumberFormatException e) {
			return Optional.empty();
		}
	}
}
