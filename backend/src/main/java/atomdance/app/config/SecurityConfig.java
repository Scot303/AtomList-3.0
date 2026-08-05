package atomdance.app.config;

import atomdance.app.common.exception.ErrorResponseWriter;
import atomdance.app.common.ratelimit.RateLimitFilter;
import atomdance.app.common.security.CookieAuthCsrfFilter;
import atomdance.app.common.security.RestAccessDeniedHandler;
import atomdance.app.common.security.RestAuthenticationEntryPoint;
import atomdance.app.modules.user.service.JwtUserAuthenticationConverter;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	private static final int MIN_SECRET_BYTES = 32;

	/**
	 * The only endpoints that authenticate from a cookie, and therefore the only ones carrying ambient authority a forged cross-site request could ride on.
	 */
	private static final Set<String> COOKIE_AUTHENTICATED_PATHS = Set.of("/api/auth/refresh", "/api/auth/logout");

	@Value("${app.security.jwt-secret}")
	private String jwtSecret;

	@Value("${app.security.jwt-issuer}")
	private String jwtIssuer;

	@Value("${app.cors.allowed-origin-patterns}")
	private List<String> allowedOriginPatterns;

	/**
	 * API-only. The frontend is deployed separately to Cloudflare Pages, so nothing here serves static
	 * assets or an {@code index.html}.
	 */
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http, RateLimitFilter rateLimitFilter, ErrorResponseWriter errorResponseWriter, JwtUserAuthenticationConverter jwtAuthenticationConverter, RestAuthenticationEntryPoint authenticationEntryPoint, RestAccessDeniedHandler accessDeniedHandler) throws Exception {

		http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				// Spring's own CSRF machinery stays off: almost the whole API authorises off a bearer
				// token the browser never attaches automatically, so there is no ambient authority to
				// abuse. The refresh cookie is the one exception, and CookieAuthCsrfFilter below covers
				// exactly the two paths that read it.
				.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(
								"/api/auth/otp/request",
								"/api/auth/otp/verify",
								"/api/auth/refresh",
								"/api/auth/logout",
								"/api/auth/email/verify",
								"/api/auth/email/resend"
						).permitAll()
						.requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
						.requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
						.anyRequest().authenticated()
				)
				// Ahead of authentication so a flood is rejected before it reaches bcrypt.
				.addFilterBefore(rateLimitFilter, BearerTokenAuthenticationFilter.class)
				.addFilterBefore(new CookieAuthCsrfFilter(COOKIE_AUTHENTICATED_PATHS, errorResponseWriter),
						BearerTokenAuthenticationFilter.class)
				.oauth2ResourceServer(oauth2 -> oauth2
						.authenticationEntryPoint(authenticationEntryPoint)
						.accessDeniedHandler(accessDeniedHandler)
						.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
				)
				.exceptionHandling(handling -> handling
						.authenticationEntryPoint(authenticationEntryPoint)
						.accessDeniedHandler(accessDeniedHandler)
				)
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

		return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	/**
	 * Signature and expiry are checked by default; everything else has to be asked for.
	 */
	@Bean
	public JwtDecoder jwtDecoder() {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey()).build();

		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
				new JwtTimestampValidator(),
				new JwtIssuerValidator(jwtIssuer)
		));

		return decoder;
	}

	@Bean
	public JwtEncoder jwtEncoder() {
		JWK jwk = new OctetSequenceKey.Builder(secretKeyBytes())
				.algorithm(JWSAlgorithm.HS256)
				.build();

		JWKSource<SecurityContext> jwks = new ImmutableJWKSet<>(new JWKSet(jwk));

		return new NimbusJwtEncoder(jwks);
	}

	private SecretKey secretKey() {
		return new SecretKeySpec(secretKeyBytes(), "HmacSHA256");
	}

	private byte[] secretKeyBytes() {
		byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);

		if (keyBytes.length < MIN_SECRET_BYTES) {
			throw new IllegalStateException("app.security.jwt-secret must be at least " + MIN_SECRET_BYTES + " bytes for HS256, but is " + keyBytes.length);
		}

		return keyBytes;
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		assertOriginPatternsAreScoped(allowedOriginPatterns);

		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOriginPatterns(allowedOriginPatterns);
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Accept-Language", CookieAuthCsrfFilter.HEADER));
		configuration.setExposedHeaders(List.of("Content-Disposition", "Retry-After"));
		configuration.setAllowCredentials(true);
		configuration.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);

		return source;
	}

	/**
	 * Domains anyone can get a host under by signing up, plus the two-level public suffixes we are
	 * likely to meet. A wildcard sitting directly on top of one of these is open to the whole
	 * internet, and with {@code allowCredentials} that means any stranger's site could read this
	 * API's authenticated responses.
	 */
	private static final Set<String> SHARED_SUFFIXES = Set.of(
			"pages.dev", "workers.dev", "trycloudflare.com",
			"vercel.app", "netlify.app", "netlify.com",
			"github.io", "gitlab.io",
			"up.railway.app", "onrender.com", "fly.dev", "herokuapp.com",
			"azurewebsites.net", "azurestaticapps.net", "web.app", "firebaseapp.com",
			"ngrok-free.app", "ngrok.app", "loca.lt",
			"co.uk", "org.uk", "com.pl", "net.pl", "org.pl", "com.au", "co.jp", "com.br", "co.nz"
	);

	/**
	 * Refuses to start on an origin pattern whose wildcard covers a whole public suffix.
	 */
	static void assertOriginPatternsAreScoped(List<String> patterns) {
		for (String pattern : patterns) {
			String host = hostOf(pattern);

			if (!host.startsWith("*")) {
				continue;
			}

			String belowWildcard = host.startsWith("*.") ? host.substring(2) : "";
			boolean coversWholeLabels = host.startsWith("*.");
			boolean namesADomainWeControl = belowWildcard.indexOf('.') > 0 && !SHARED_SUFFIXES.contains(belowWildcard);

			if (!coversWholeLabels || !namesADomainWeControl) {
				throw new IllegalStateException(
						"CORS origin pattern '" + pattern + "' is too broad to use with credentials: its wildcard " +
								"covers hosts you do not own, so a stranger's site could read this API's authenticated " +
								"responses. Anchor the wildcard on a domain of yours with a dot, e.g. " +
								"'https://*.yourdomain.pages.dev', or name the origin exactly.");
			}
		}
	}

	/**
	 * The host part of an origin pattern, with the scheme and any port pattern removed.
	 */
	private static String hostOf(String originPattern) {
		String host = originPattern.replaceFirst("^[a-zA-Z][a-zA-Z0-9+.-]*://", "");
		int portSeparator = host.lastIndexOf(':');

		// Compared against ']' so the colons inside a bracketed IPv6 literal are left alone.
		return portSeparator > host.lastIndexOf(']') ? host.substring(0, portSeparator) : host;
	}
}
