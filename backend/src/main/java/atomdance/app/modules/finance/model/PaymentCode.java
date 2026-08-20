package atomdance.app.modules.finance.model;

import java.util.Optional;


/**
 * The spoken form of {@link Payment#getNumber()}: "P-1234".
 */
public final class PaymentCode {

	public static final String PREFIX = "P-";

	/**
	 * Separates a payment from one of its settlements: "P-1234/1".
	 */
	public static final String PART_SEPARATOR = "/";


	private PaymentCode() {
	}


	/**
	 * @return the code for a saved payment, or {@code null} for one the database has not numbered yet
	 */
	public static String format(Long number) {
		return SpokenCode.format(PREFIX, number);
	}


	/**
	 * Names one settlement: its payment's code, then the settlement's own number - "P-1234/1", "P-1234/2".
	 */
	public static String formatLine(String paymentCode, Long number) {
		if (paymentCode == null || number == null) {
			return null;
		}

		return paymentCode + PART_SEPARATOR + number;
	}


	/**
	 * Reads back what somebody actually types: "P-1234", "p-1234", a bare "1234", any of them padded with spaces, or one of a payment's settlements - "P-1234/2" finds P-1234.
	 */
	public static Optional<Long> parse(String code) {
		return SpokenCode.parse(PREFIX, PART_SEPARATOR, code);
	}
}
