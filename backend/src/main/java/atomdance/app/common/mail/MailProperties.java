package atomdance.app.common.mail;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Addressing, link-building and transport credentials for outbound authentication mail.
 */
@Component
@ConfigurationProperties(prefix = "app.mail")
@Getter
@Setter
public class MailProperties {

	private String from = "no-reply@localhost";

	private String fromName = "AtomList";

	private final Resend resend = new Resend();

	private String verificationUrl = "http://localhost:5173/verify-email?token={token}";

	public String buildVerificationUrl(String token) {
		return verificationUrl.replace("{token}", token);
	}

	public String buildFromAddress() {
		return "%s <%s>".formatted(fromName, from);
	}

	@Getter
	@Setter
	public static class Resend {

		/**
		 * Resend API key. Leaving it unset is what selects the log-only mailer.
		 */
		private String apiKey;
	}
}
