package atomdance.app.modules.sms.dto;

import java.util.List;


/**
 * What one SMS send actually did.
 * <p>
 * People are dropped rather than refused.
 *
 * @param sent    the messages that went out
 * @param skipped everybody who was asked for but could not be reached
 */
public record SmsSendResultView(
		List<SmsView> sent,
		List<SkippedRecipientView> skipped
) {}
