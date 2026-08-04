package atomdance.app.support;

import atomdance.app.common.mail.AuthMailer;
import atomdance.app.common.security.CookieAuthCsrfFilter;
import atomdance.app.common.security.RefreshCookieService;
import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.EmailVerificationTokenRepository;
import atomdance.app.modules.user.repository.LoginCodeRepository;
import atomdance.app.modules.user.repository.RefreshTokenRepository;
import atomdance.app.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Import(AuthIntegrationTestBase.RecordingMailConfig.class)
public abstract class AuthIntegrationTestBase {

	@SuppressWarnings("resource")
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

	static {
		POSTGRES.start();
	}

	@DynamicPropertySource
	static void datasource(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	/**
	 * Replaces whatever {@code MailConfig} would have chosen.
	 * Marked {@code @Primary} because that bean is still defined - this is the one that gets injected.
	 */
	@TestConfiguration
	public static class RecordingMailConfig {

		@Bean
		@Primary
		public AuthMailer recordingAuthMailer() {
			return new RecordingAuthMailer();
		}
	}

	@Autowired
	protected WebApplicationContext context;

	@Autowired
	protected UserRepository userRepository;

	@Autowired
	protected RefreshTokenRepository refreshTokenRepository;

	@Autowired
	protected LoginCodeRepository loginCodeRepository;

	@Autowired
	protected EmailVerificationTokenRepository emailVerificationTokenRepository;

	@Autowired
	protected AuthMailer authMailer;

	@Autowired
	protected RefreshCookieService refreshCookieService;

	@Autowired
	protected JdbcTemplate jdbcTemplate;

	protected final ObjectMapper objectMapper = new ObjectMapper();

	protected MockMvc mockMvc;

	@BeforeEach
	void resetEverything() {
		mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

		loginCodeRepository.deleteAll();
		emailVerificationTokenRepository.deleteAll();
		refreshTokenRepository.deleteAll();
		userRepository.deleteAll();

		mailer().clear();
	}

	protected RecordingAuthMailer mailer() {
		return (RecordingAuthMailer) authMailer;
	}

	// ---------------------------------------------------------------- fixtures

	protected User givenUser(String username, Role role) {
		return givenUser(username, role, true, true, EnumSet.noneOf(Permission.class));
	}

	protected User givenUser(String username, Role role, boolean active, boolean emailVerified) {
		return givenUser(username, role, active, emailVerified, EnumSet.noneOf(Permission.class));
	}

	protected User givenUser(String username, Role role, boolean active, boolean emailVerified, Set<Permission> additional) {
		return userRepository.saveAndFlush(User.builder()
				.username(username)
				.email(username + "@example.com")
				.role(role)
				.additionalPermissions(additional)
				.isActive(active)
				.isEmailVerified(emailVerified)
				.build());
	}

	// ---------------------------------------------------------------- sign-in

	protected void requestCode(String identifier) throws Exception {
		mockMvc.perform(post("/api/auth/otp/request")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"identifier":"%s"}""".formatted(identifier)))
				.andExpect(status().isAccepted());
	}

	/**
	 * The code as the user reads it out of their inbox - groups of four, spaces, and all. Fed back
	 * verbatim so the suite exercises the same normalization a real paste goes through.
	 */
	protected String mailedCodeFor(String username) throws Exception {
		requestCode(username);

		return mailer().lastLoginCode().orElseThrow(() -> new AssertionError("No login code was sent to " + username)).displayCode();
	}

	protected MvcResult verifyCode(String identifier, String code, ResultMatcher expected) throws Exception {
		return mockMvc.perform(post("/api/auth/otp/verify")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new IdentifierAndCode(identifier, code))))
				.andExpect(expected)
				.andReturn();
	}

	/**
	 * A complete sign-in: ask for a code, read it from the mail, redeem it.
	 */
	protected MvcResult signIn(String username) throws Exception {
		return verifyCode(username, mailedCodeFor(username), status().isOk());
	}

	protected String accessTokenOf(MvcResult result) throws Exception {
		return bodyOf(result).get("token").asText();
	}

	protected String signInAndGetToken(String username) throws Exception {
		return accessTokenOf(signIn(username));
	}

	// ---------------------------------------------------------------- plumbing

	protected JsonNode bodyOf(MvcResult result) throws Exception {
		return objectMapper.readTree(result.getResponse().getContentAsString());
	}

	protected String errorCodeOf(MvcResult result) throws Exception {
		return bodyOf(result).get("errorCode").asText();
	}

	protected Cookie refreshCookieOf(MvcResult result) {
		Cookie cookie = result.getResponse().getCookie(refreshCookieName());

		if (cookie == null) {
			throw new AssertionError("The response set no " + refreshCookieName() + " cookie");
		}

		return cookie;
	}

	protected String refreshCookieName() {
		return refreshCookieService.cookieName();
	}

	/**
	 * Rotation as the browser performs it: the cookie goes back on its own, and the client adds the
	 * one header {@link CookieAuthCsrfFilter} insists on.
	 */
	protected MvcResult refresh(String refreshToken, ResultMatcher expected) throws Exception {
		return mockMvc.perform(post("/api/auth/refresh")
						.cookie(new Cookie(refreshCookieName(), refreshToken))
						.header(CookieAuthCsrfFilter.HEADER, "1"))
				.andExpect(expected)
				.andReturn();
	}

	/**
	 * Backdates a stored code so expiry can be asserted without the suite sleeping through a TTL.
	 * Straight SQL rather than JPA, to keep a test-only concern out of the repository interface.
	 */
	protected void expireLoginCodesFor(UUID userId) {
		jdbcTemplate.update(
				"UPDATE login_codes SET expires_at = ? WHERE user_id = ?",
				Timestamp.from(Instant.now().minusSeconds(3600)),
				userId);
	}

	private record IdentifierAndCode(String identifier, String code) {}
}
