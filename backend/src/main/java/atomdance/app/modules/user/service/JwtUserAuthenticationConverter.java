package atomdance.app.modules.user.service;

import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Turns a verified JWT into an Authentication carrying the user's real authorities.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUserAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

	private static final String ROLE_PREFIX = "ROLE_";

	private final UserRepository userRepository;

	@Override
	@Transactional(readOnly = true)
	public AbstractAuthenticationToken convert(Jwt jwt) {
		UUID userId = parseSubject(jwt);
		User user = userRepository.findByIdWithPermissions(userId)
				.orElseThrow(() -> invalid("no account exists for subject " + userId));

		if (!user.isActive()) {
			throw invalid("account " + userId + " is deactivated");
		}

		if (!hasCurrentTokenVersion(jwt, user)) {
			throw invalid("token for account " + userId + " predates the last session invalidation");
		}

		return new JwtAuthenticationToken(jwt, toAuthorities(user), user.getUsername());
	}

	private UUID parseSubject(Jwt jwt) {
		String subject = jwt.getSubject();

		if (subject == null) {
			throw invalid("token has no subject");
		}

		try {
			return UUID.fromString(subject);
		} catch (IllegalArgumentException e) {
			throw invalid("token subject is not a UUID");
		}
	}

	private boolean hasCurrentTokenVersion(Jwt jwt, User user) {
		Object claim = jwt.getClaim(JwtService.TOKEN_VERSION_CLAIM);

		return claim instanceof Number version && version.intValue() == user.getTokenVersion();
	}

	private Collection<GrantedAuthority> toAuthorities(User user) {
		List<GrantedAuthority> authorities = new ArrayList<>();

		for (Permission permission : user.getAllPermissions()) {
			authorities.add(new SimpleGrantedAuthority(permission.name()));
		}

		authorities.add(new SimpleGrantedAuthority(ROLE_PREFIX + user.getRole().name()));

		return authorities;
	}

	private InvalidBearerTokenException invalid(String reason) {
		log.debug("Rejecting bearer token: {}", reason);

		return new InvalidBearerTokenException("The token is not valid");
	}
}
