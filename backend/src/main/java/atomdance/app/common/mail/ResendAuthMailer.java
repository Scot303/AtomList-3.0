package atomdance.app.common.mail;

import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.scheduling.annotation.Async;

import java.util.Locale;


/**
 * Sends through Resend's HTTP API. Wired by {@code MailConfig} whenever {@code app.mail.resend.api-key} is set.
 */
@RequiredArgsConstructor
public class ResendAuthMailer implements AuthMailer {

	private final Resend resend;
	private final MessageSource messageSource;
	private final MailProperties properties;
	private final AuditLogger auditLogger;


	@Override
	@Async
	public void sendLoginCode(String email, String recipientName, String displayCode, long validForMinutes, Locale locale) {
		send(
				email,
				text("mail.login_code.subject", locale),
				text("mail.login_code.body", locale, recipientName, displayCode, validForMinutes),
				"login code"
		);
	}


	@Override
	@Async
	public void sendEmailVerification(String email, String recipientName, String verificationUrl, long validForHours, Locale locale) {
		send(
				email,
				text("mail.email_verification.subject", locale),
				text("mail.email_verification.body", locale, recipientName, verificationUrl, validForHours),
				"verification link"
		);
	}


	private void send(String to, String subject, String body, String what) {
		CreateEmailOptions message = CreateEmailOptions.builder()
				.from(properties.buildFromAddress())
				.to(to)
				.subject(subject)
				.text(body)
				.build();

		try {
			CreateEmailResponse response = resend.emails().send(message);

			auditLogger.systemSuccessNow(AuditEventType.EMAIL_DELIVERY, null, "Sent %s to %s (message %s).", what, redact(to), response.getId());
		} catch (ResendException | RuntimeException e) {
			auditLogger.systemFailure(AuditEventType.EMAIL_DELIVERY, null, "Failed to send %s to %s: %s", what, redact(to), e.getMessage());
		}
	}


	private String text(String key, Locale locale, Object... args) {
		return messageSource.getMessage(key, args, key, locale);
	}


	private static String redact(String email) {
		int at = email.indexOf('@');

		return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
	}
}
