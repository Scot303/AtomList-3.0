package atomdance.app.modules.user.service;

import atomdance.app.modules.user.exception.UserNotAuthenticatedException;
import atomdance.app.modules.user.model.Permission;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
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

	public boolean hasPermission(Permission permission) {
		String authority = permission.name();

		for (GrantedAuthority granted : currentToken().getAuthorities()) {
			if (authority.equals(granted.getAuthority())) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @throws AccessDeniedException handled by {@code GlobalExceptionHandler} into a 403
	 */
	public void requirePermission(Permission permission) {
		if (!hasPermission(permission)) {
			throw new AccessDeniedException("Missing authority " + permission.name());
		}
	}

	private JwtAuthenticationToken currentToken() {
		var auth = SecurityContextHolder.getContext().getAuthentication();

		if (auth instanceof JwtAuthenticationToken jwt) {
			return jwt;
		}

		throw new UserNotAuthenticatedException();
	}
}
