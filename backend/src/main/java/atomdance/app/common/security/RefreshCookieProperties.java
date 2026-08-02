package atomdance.app.common.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Attributes of the cookie the refresh token travels in. Defaults are the production-correct ones.
 */
@Component
@ConfigurationProperties(prefix = "app.security.refresh-cookie")
@Getter @Setter
public class RefreshCookieProperties {

	/**
	 * The {@code __Secure-} prefix is a browser-enforced promise: a cookie named this way is refused
	 * outright unless it carries {@code Secure} and was set over HTTPS. That closes the gap where a
	 * network attacker downgrades one request to plain HTTP purely to overwrite the cookie.
	 */
	private String name = "__Secure-refreshToken";

	/**
	 * Scoped to the auth endpoints, which are the only ones that read it.
	 */
	private String path = "/api/auth";

	private boolean secure = true;

	/**
	 * Set to {@code Lax} where the two are served from one origin; it is strictly better when available.
	 */
	private String sameSite = "None";

	/**
	 * Left empty so the cookie is host-only. Setting a registrable domain would share it with every
	 * subdomain, including any that is not ours to trust.
	 */
	private String domain = "";
}
