package atomdance.app.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConfigurationProperties(prefix = "app.security.login")
@Getter
@Setter
public class LoginPolicyProperties {

	private final Code code = new Code();
	private final Lockout lockout = new Lockout();
	private final EmailVerification emailVerification = new EmailVerification();

	@Getter
	@Setter
	public static class Code {

		/**
		 * Password length in the emailed code.
		 */
		private int length = 16;

		/**
		 * How long the user has to move from their inbox back to the sign-in form.
		 */
		private Duration ttl = Duration.ofMinutes(15);

		/**
		 * Minimum gap between two codes for the same account.
		 */
		private Duration resendCooldown = Duration.ofSeconds(60);

		/**
		 * Wrong guesses one code tolerates before it is burned.
		 */
		private int maxAttempts = 5;
	}

	@Getter
	@Setter
	public static class Lockout {

		/**
		 * Consecutive failures across all codes before the account is locked.
		 */
		private int maxFailedAttempts = 10;

		/**
		 * How long a lockout lasts if nobody intervenes. An administrator can clear it sooner.
		 */
		private Duration duration = Duration.ofMinutes(60);
	}

	@Getter
	@Setter
	public static class EmailVerification {

		/**
		 * How long should the verification links survive for.
		 */
		private Duration ttl = Duration.ofDays(7);

		private Duration resendCooldown = Duration.ofMinutes(5);
	}
}
