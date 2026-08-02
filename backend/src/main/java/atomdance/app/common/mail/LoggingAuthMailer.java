package atomdance.app.common.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;

import java.util.Locale;

/**
 * The fallback used when no Resend API key is configured: writes what it would have sent to the log
 * so local development needs no mail infrastructure at all.
 */
@Slf4j
public class LoggingAuthMailer implements AuthMailer {

	private static final String PRODUCTION_PROFILE = "prod";

	public LoggingAuthMailer(Environment environment) {
		if (environment.matchesProfiles(PRODUCTION_PROFILE)) {
			throw new IllegalStateException(
					"No mail transport is configured (app.mail.resend.api-key is unset). Configure mail before starting the '" + PRODUCTION_PROFILE + "' profile.");
		}

		log.warn("No mail transport configured - authentication mail will be written to this log instead of being sent.");
	}

	@Override
	public void sendLoginCode(String email, String recipientName, String displayCode, long validForMinutes, Locale locale) {
		log.warn("[MAIL] Login code for {}: {} (valid for {} minutes)", email, displayCode, validForMinutes);
	}

	@Override
	public void sendEmailVerification(String email, String recipientName, String verificationUrl, long validForHours, Locale locale) {
		log.warn("[MAIL] Verification link for {}: {} (valid for {} hours)", email, verificationUrl, validForHours);
	}
}
