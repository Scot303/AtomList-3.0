package atomdance.app.common.ratelimit;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

/**
 * Tuning for {@link RateLimitFilter}. Every field has a working default, so the whole {@code app.security.rate-limit} block is optional.
 */
@Component
@ConfigurationProperties(prefix = "app.security.rate-limit")
@Getter @Setter
public class RateLimitProperties {

	private boolean enabled = true;

	/**
	 * Requests allowed per {@link #refillPeriod}, per client, per path.
	 */
	private int capacity = 10;

	private Duration refillPeriod = Duration.ofMinutes(1);

	/**
	 * How many reverse-proxy hops sit in front of the app, and therefore how many trailing entries of
	 * {@code X-Forwarded-For} were written by infrastructure we control rather than by the caller.
	 */
	private int trustedProxyCount = 0;

	/**
	 * Exact request paths to limit. Anything not listed is untouched.
	 */
	private List<String> paths = List.of(
			"/api/auth/otp/request",
			"/api/auth/otp/verify",
			"/api/auth/refresh",
			"/api/auth/email/verify",
			"/api/auth/email/resend"
	);
}