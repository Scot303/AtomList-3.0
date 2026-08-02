package atomdance.app.modules.user.service;

import atomdance.app.modules.user.exception.UserNotAuthenticatedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Reads the caller's identity out of the security context.
 */
@Service
public class SecurityService {

	public UUID getCurrentUserId() {
		JwtAuthenticationToken token = currentToken();

		try {
			return UUID.fromString(token.getToken().getSubject());
		} catch (IllegalArgumentException | NullPointerException e) {
			throw new UserNotAuthenticatedException();
		}
	}

	public String getCurrentUsername() {
		return currentToken().getToken().getClaimAsString(JwtService.USERNAME_CLAIM);
	}

	private JwtAuthenticationToken currentToken() {
		var auth = SecurityContextHolder.getContext().getAuthentication();

		if (auth instanceof JwtAuthenticationToken jwt) {
			return jwt;
		}

		throw new UserNotAuthenticatedException();
	}
}
