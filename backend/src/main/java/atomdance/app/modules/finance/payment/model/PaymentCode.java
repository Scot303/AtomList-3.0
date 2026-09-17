package atomdance.app.modules.finance.payment.model;

import atomdance.app.common.utils.SpokenCode;


/**
 * The spoken form of {@link Payment#getNumber()}: "P-12".
 */
public final class PaymentCode {

	public static final String PREFIX = "P-";

	/**
	 * Separates a payment from one of its settlements: "P-12/1".
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
	 * Names one settlement: its payment's code, then the settlement's own number - "P-12/1", "P-12/2".
	 */
	public static String formatLine(String paymentCode, Long number) {
		if (paymentCode == null || number == null) {
			return null;
		}

		return paymentCode + PART_SEPARATOR + number;
	}

}
