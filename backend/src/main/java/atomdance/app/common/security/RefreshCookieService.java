package atomdance.app.common.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Builds and reads the refresh-token cookie.
 */
@Service
public class RefreshCookieService {

	private final RefreshCookieProperties properties;
	private final Duration ttl;

	public RefreshCookieService(RefreshCookieProperties properties, @Value("${app.security.refresh-token-ttl}") Duration ttl) {
		this.properties = properties;
		this.ttl = ttl;
	}

	public String cookieName() {
		return properties.getName();
	}

	public ResponseCookie issue(String rawToken) {
		return base(rawToken).maxAge(ttl).build();
	}

	/**
	 * The removal instruction. Same name, path and domain as the original - a browser matches on all
	 * three, so a clear that differs in any of them leaves the real cookie sitting there.
	 */
	public ResponseCookie clear() {
		return base("").maxAge(0).build();
	}

	public String read(HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();

		if (cookies == null) {
			return null;
		}

		for (Cookie cookie : cookies) {
			if (properties.getName().equals(cookie.getName())) {
				return cookie.getValue();
			}
		}

		return null;
	}

	private ResponseCookie.ResponseCookieBuilder base(String value) {
		ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(properties.getName(), value)
				.httpOnly(true)
				.secure(properties.isSecure())
				.path(properties.getPath())
				.sameSite(properties.getSameSite());

		if (!properties.getDomain().isBlank()) {
			builder.domain(properties.getDomain());
		}

		return builder;
	}
}
