package atomdance.app.common.utils;

import atomdance.app.modules.finance.deposit.model.DepositCode;
import atomdance.app.modules.finance.payment.model.PaymentCode;

import java.util.Optional;


/**
 * The shape both {@link PaymentCode} and {@link DepositCode} take: a letter, a dash, and a number the database handed out.
 */
public final class SpokenCode {

	private SpokenCode() {
	}


	public static String format(String prefix, Long number) {
		if (number == null) {
			return null;
		}

		return prefix + number;
	}


	/**
	 * Reads back what somebody actually types: with the prefix or without it, in either case, padded with
	 * spaces, and - where {@code separator} is given - with any trailing part after it ignored.
	 *
	 * @param separator what divides a code from a part of it, or {@code null} if it has no parts
	 */
	public static Optional<Long> parse(String prefix, String separator, String code) {
		if (code == null) {
			return Optional.empty();
		}

		String digits = code.trim();

		if (separator != null) {
			int part = digits.indexOf(separator);

			if (part >= 0) {
				digits = digits.substring(0, part).trim();
			}
		}

		if (digits.regionMatches(true, 0, prefix, 0, prefix.length())) {
			digits = digits.substring(prefix.length()).trim();
		}

		try {
			long number = Long.parseLong(digits);

			return number < 1 ? Optional.empty() : Optional.of(number);
		} catch (NumberFormatException e) {
			return Optional.empty();
		}
	}
}
