package atomdance.app.modules.user.service;

import atomdance.app.modules.user.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class JwtService {

	public static final String TOKEN_VERSION_CLAIM = "tv";
	public static final String USERNAME_CLAIM = "username";

	private final JwtEncoder encoder;
	private final String issuer;
	private final Duration accessTokenTtl;

	public JwtService(JwtEncoder encoder, @Value("${app.security.jwt-issuer}") String issuer, @Value("${app.security.access-token-ttl}") Duration accessTokenTtl) {
		this.encoder = encoder;
		this.issuer = issuer;
		this.accessTokenTtl = accessTokenTtl;
	}

	/**
	 * Mints an access token.
	 * Permissions are deliberately not claims. {@link JwtUserAuthenticationConverter} reads
	 * them from the database on each request, so a permission change or a deactivation takes effect
	 * immediately rather than waiting out the token's lifetime.
	 */
	public String generateToken(User user) {
		Instant now = Instant.now();

		JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer(issuer)
				.issuedAt(now)
				.expiresAt(now.plus(accessTokenTtl))
				.subject(user.getId().toString())
				.claim(USERNAME_CLAIM, user.getUsername())
				.claim(TOKEN_VERSION_CLAIM, user.getTokenVersion())
				.build();

		return this.encoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
	}
}
