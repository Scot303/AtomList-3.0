package atomdance.app.modules.sms.dto;

import java.util.UUID;


/**
 * Somebody an SMS was asked to reach and could not.
 */
public record SkippedRecipientView(
		UUID personId,
		String fullName,
		SkipReason reason
) {

	public enum SkipReason {
		/**
		 * Neither they nor their household has a number.
		 */
		NO_PHONE,

		/**
		 * Their number is not on {@code app.sms.phoneWhitelist}.
		 */
		NOT_WHITELISTED
	}
}
