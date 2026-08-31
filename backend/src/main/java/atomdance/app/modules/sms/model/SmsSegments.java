package atomdance.app.modules.sms.model;

import lombok.experimental.UtilityClass;


/**
 * How many chargeable parts a message costs, because the operator bills per part, not per message.
 * <p>
 * A plain ASCII text fits 160 characters in one part, and a single Polish diacritic switches the whole thing to UCS-2 and drops that to 70.
 * Anything longer is split, and each part gives up a few characters to the header that lets the handset reassemble them.</p>
 */
@UtilityClass
public class SmsSegments {

	/**
	 * Characters the GSM 03.38 alphabet holds, so a message made only of these is sent 7 bits at a time.
	 */
	private static final String GSM_ALPHABET = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
			+ "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

	/**
	 * These take two of the 160 slots each, being an escape plus the character itself.
	 */
	private static final String GSM_EXTENDED = "^{}\\[~]|€";

	private static final int GSM_SINGLE = 160;
	private static final int GSM_CONCATENATED = 153;
	private static final int UNICODE_SINGLE = 70;
	private static final int UNICODE_CONCATENATED = 67;


	/**
	 * @return how many parts {@code message} is sent as, and so how many the studio pays for. Zero for nothing to send.
	 */
	public static int count(String message) {
		if (message == null || message.isEmpty()) {
			return 0;
		}

		boolean unicode = !isGsmEncodable(message);
		int length = unicode ? message.length() : gsmLength(message);

		int single = unicode ? UNICODE_SINGLE : GSM_SINGLE;

		if (length <= single) {
			return 1;
		}

		int perPart = unicode ? UNICODE_CONCATENATED : GSM_CONCATENATED;

		return (length + perPart - 1) / perPart;
	}


	/**
	 * Whether every character of the message survives the 7-bit alphabet, which is what keeps a text at 160 characters a part rather than 70.
	 */
	public static boolean isGsmEncodable(String message) {
		return message.chars().allMatch(character -> GSM_ALPHABET.indexOf(character) >= 0 || GSM_EXTENDED.indexOf(character) >= 0);
	}


	/**
	 * The message's length in 7-bit slots, where the handful of extended characters take two apiece.
	 */
	private static int gsmLength(String message) {
		return message.length() + (int) message.chars().filter(character -> GSM_EXTENDED.indexOf(character) >= 0).count();
	}
}
