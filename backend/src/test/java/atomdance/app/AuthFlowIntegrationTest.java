package atomdance.app;

import atomdance.app.common.security.CookieAuthCsrfFilter;
import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;
import atomdance.app.support.AuthIntegrationTestBase;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end cover for the auth stack against a real Postgres, driving the full filter chain rather
 * than individual beans - the bugs this suite is guarding against (a refresh token leaking back into
 * the body, claims that decode to the wrong type, authorities that never reach {@code @PreAuthorize})
 * are only visible once everything is wired together.
 */
class AuthFlowIntegrationTest extends AuthIntegrationTestBase {

	private static final String NEW_PERSON = """
			{"name":"Anna","lastName":"Kowalska"}""";

	// ------------------------------------------------------------ signing in

	@Test
	void signingInWithAMailedCodeReturnsAnAccessTokenAndTheCallersPermissions() throws Exception {
		givenUser("admin", Role.ADMIN);

		JsonNode body = bodyOf(signIn("admin"));

		assertThat(body.get("token").asText()).isNotBlank();
		assertThat(body.get("user").get("username").asText()).isEqualTo("admin");
		assertThat(body.get("user").get("permissions")).isNotEmpty();
		assertThat(body.get("user").get("emailVerified").asBoolean()).isTrue();
	}

	@Test
	void theRefreshTokenIsAnHttpOnlyCookieAndNeverAppearsInTheBody() throws Exception {
		givenUser("admin", Role.ADMIN);

		MvcResult result = signIn("admin");

		assertThat(result.getResponse().getContentAsString()).doesNotContain("refreshToken");
		assertThat(bodyOf(result).has("refreshToken")).isFalse();

		Cookie cookie = refreshCookieOf(result);

		assertThat(cookie.getValue()).isNotBlank();
		assertThat(cookie.isHttpOnly()).isTrue();
		assertThat(cookie.getPath()).isEqualTo("/api/auth");
	}

	@Test
	void theCodeIsAcceptedWithTheSpacingItWasMailedWith() throws Exception {
		givenUser("admin", Role.ADMIN);

		String mailed = mailedCodeFor("admin");

		assertThat(mailed).contains(" ");

		verifyCode("admin", mailed, status().isOk());
	}

	@Test
	void theEmailAddressWorksAsAnIdentifierToo() throws Exception {
		givenUser("admin", Role.ADMIN);

		requestCode("ADMIN@Example.com");

		String code = mailer().lastLoginCode().orElseThrow().displayCode();

		verifyCode("admin@example.com", code, status().isOk());
	}

	@Test
	void aValidTokenReachesAPermittedEndpoint() throws Exception {
		givenUser("admin", Role.ADMIN);

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("admin")))
				.andExpect(status().isOk());
	}

	@Test
	void aRoleWithoutThePermissionIsRefused() throws Exception {
		givenUser("reception", Role.RECEPTIONIST);
		String token = signInAndGetToken("reception");

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content(NEW_PERSON))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED_403"));
	}

	@Test
	void anIndividualGrantOpensAnEndpointTheRoleDoesNot() throws Exception {
		givenUser("reception", Role.RECEPTIONIST, true, true, EnumSet.of(Permission.MODIFY_PERSONS));

		mockMvc.perform(post("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("reception"))
						.contentType(MediaType.APPLICATION_JSON)
						.content(NEW_PERSON))
				.andExpect(status().isCreated());
	}

	// ------------------------------------------------- what sign-in refuses

	@Test
	void anInactiveAccountIsNeverSentACode() throws Exception {
		givenUser("dormant", Role.ADMIN, false, true);

		requestCode("dormant");

		assertThat(mailer().loginCodes()).isEmpty();
	}

	@Test
	void anUnknownIdentifierIsReportedExactlyLikeAWrongCode() throws Exception {
		givenUser("admin", Role.ADMIN);
		mailedCodeFor("admin");

		MvcResult unknownAccount = verifyCode("nobody", "AAAA BBBB CCCC DDDD", status().isUnauthorized());
		MvcResult wrongCode = verifyCode("admin", "AAAA BBBB CCCC DDDD", status().isUnauthorized());

		assertThat(errorCodeOf(unknownAccount)).isEqualTo(errorCodeOf(wrongCode));
		assertThat(errorCodeOf(wrongCode)).isEqualTo("INVALID_LOGIN_CODE_401");
	}

	@Test
	void anExpiredCodeIsRefused() throws Exception {
		User user = givenUser("admin", Role.ADMIN);
		String code = mailedCodeFor("admin");

		expireLoginCodesFor(user.getId());

		verifyCode("admin", code, status().isUnauthorized());
	}

	@Test
	void askingForASecondCodeInvalidatesTheFirst() throws Exception {
		givenUser("admin", Role.ADMIN);

		String first = mailedCodeFor("admin");
		String second = mailedCodeFor("admin");

		assertThat(second).isNotEqualTo(first);

		verifyCode("admin", first, status().isUnauthorized());
		verifyCode("admin", second, status().isOk());
	}

	@Test
	void aSpentCodeCannotBeUsedTwice() throws Exception {
		givenUser("admin", Role.ADMIN);

		String code = mailedCodeFor("admin");

		verifyCode("admin", code, status().isOk());
		verifyCode("admin", code, status().isUnauthorized());
	}

	@Test
	void wrongGuessesBurnTheCodeAndThenLockTheAccount() throws Exception {
		User user = givenUser("admin", Role.ADMIN);
		mailedCodeFor("admin");

		for (int attempt = 0; attempt < 3; attempt++) {
			verifyCode("admin", "wrong-code-" + attempt, status().isUnauthorized());
		}

		String correct = mailedCodeFor("admin");

		assertThat(userRepository.findById(user.getId()).orElseThrow().isLockedAt(java.time.Instant.now())).isFalse();

		verifyCode("admin", "still-wrong", status().isUnauthorized());
		verifyCode("admin", "still-wrong", status().isUnauthorized());

		MvcResult locked = verifyCode("admin", correct, status().isLocked());

		assertThat(errorCodeOf(locked)).isEqualTo("ACCOUNT_LOCKED_423");
		assertThat(userRepository.findById(user.getId()).orElseThrow().isLockedAt(java.time.Instant.now())).isTrue();
	}

	@Test
	void aLockedAccountIsNotSentFurtherCodes() throws Exception {
		User user = givenUser("admin", Role.ADMIN);

		user.setLockedUntil(java.time.Instant.now().plusSeconds(600));
		userRepository.saveAndFlush(user);

		requestCode("admin");

		assertThat(mailer().loginCodes()).isEmpty();
	}

	// -------------------------------------------------- email verification

	@Test
	void anUnverifiedAddressGetsTheVerificationLinkInsteadOfACode() throws Exception {
		givenUser("fresh", Role.EMPLOYEE, true, false);

		requestCode("fresh");

		assertThat(mailer().loginCodes()).isEmpty();
		assertThat(mailer().lastVerification()).isPresent();
	}

	@Test
	void clickingTheVerificationLinkIsWhatMakesAnAccountUsable() throws Exception {
		givenUser("fresh", Role.EMPLOYEE, true, false);

		requestCode("fresh");
		verifyEmail(tokenFromLastVerificationLink(), status().isNoContent());

		JsonNode body = bodyOf(signIn("fresh"));

		assertThat(body.get("user").get("emailVerified").asBoolean()).isTrue();
	}

	@Test
	void aVerificationLinkCannotBeUsedTwice() throws Exception {
		givenUser("fresh", Role.EMPLOYEE, true, false);

		requestCode("fresh");
		String token = tokenFromLastVerificationLink();

		verifyEmail(token, status().isNoContent());
		verifyEmail(token, status().isBadRequest());
	}

	@Test
	void aGarbageVerificationTokenIsRefusedWithTheStandardEnvelope() throws Exception {
		MvcResult result = verifyEmail("not-a-real-token", status().isBadRequest());

		assertThat(errorCodeOf(result)).isEqualTo("INVALID_VERIFICATION_TOKEN_400");
	}

	@Test
	void resendingAVerificationLinkIsSilentAboutWhetherTheAccountExists() throws Exception {
		mockMvc.perform(post("/api/auth/email/resend")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"identifier":"nobody"}"""))
				.andExpect(status().isAccepted());

		assertThat(mailer().verifications()).isEmpty();
	}

	// ------------------------------------------------------------- sessions

	@Test
	void deactivatingAnAccountInvalidatesItsLiveAccessTokenImmediately() throws Exception {
		User user = givenUser("admin", Role.ADMIN);
		String token = signInAndGetToken("admin");

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isOk());

		user.setActive(false);
		userRepository.saveAndFlush(user);

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.errorCode").value("USER_401"));
	}

	@Test
	void refreshRotatesTheCookieAndSpendsTheOldToken() throws Exception {
		givenUser("admin", Role.ADMIN);
		String first = refreshCookieOf(signIn("admin")).getValue();

		MvcResult rotated = refresh(first, status().isOk());

		assertThat(bodyOf(rotated).get("token").asText()).isNotBlank();
		assertThat(bodyOf(rotated).has("refreshToken")).isFalse();
		assertThat(refreshCookieOf(rotated).getValue()).isNotEqualTo(first);
	}

	@Test
	void refreshWithoutTheAntiForgeryHeaderIsRefused() throws Exception {
		givenUser("admin", Role.ADMIN);
		String refreshToken = refreshCookieOf(signIn("admin")).getValue();

		mockMvc.perform(post("/api/auth/refresh").cookie(new Cookie(refreshCookieName(), refreshToken)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.errorCode").value("CSRF_403"));

		refresh(refreshToken, status().isOk());
	}

	@Test
	void aRefreshWithNoCookieAtAllIsRejected() throws Exception {
		mockMvc.perform(post("/api/auth/refresh").header(CookieAuthCsrfFilter.HEADER, "1"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.errorCode").value("REFRESH_TOKEN_401"));
	}

	@Test
	void aFailedRefreshClearsTheDeadCookie() throws Exception {
		MvcResult result = refresh("not-a-real-token", status().isUnauthorized());

		assertThat(refreshCookieOf(result).getValue()).isEmpty();
		assertThat(refreshCookieOf(result).getMaxAge()).isZero();
	}

	@Test
	void replayingASpentRefreshTokenKillsEverySession() throws Exception {
		User user = givenUser("admin", Role.ADMIN);
		int versionBefore = user.getTokenVersion();

		String first = refreshCookieOf(signIn("admin")).getValue();
		String second = refreshCookieOf(refresh(first, status().isOk())).getValue();

		refresh(first, status().isUnauthorized());

		assertThat(userRepository.findById(user.getId()).orElseThrow().getTokenVersion()).isGreaterThan(versionBefore);

		refresh(second, status().isUnauthorized());
	}

	@Test
	void logoutClearsTheCookieAndEndsThatSession() throws Exception {
		givenUser("admin", Role.ADMIN);
		String refreshToken = refreshCookieOf(signIn("admin")).getValue();

		MvcResult result = mockMvc.perform(post("/api/auth/logout")
						.cookie(new Cookie(refreshCookieName(), refreshToken))
						.header(CookieAuthCsrfFilter.HEADER, "1"))
				.andExpect(status().isNoContent())
				.andReturn();

		assertThat(refreshCookieOf(result).getMaxAge()).isZero();

		refresh(refreshToken, status().isUnauthorized());
	}

	@Test
	void logoutEverywhereInvalidatesExistingAccessTokens() throws Exception {
		givenUser("admin", Role.ADMIN);
		MvcResult session = signIn("admin");
		String token = accessTokenOf(session);

		mockMvc.perform(post("/api/auth/logout-all").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized());

		refresh(refreshCookieOf(session).getValue(), status().isUnauthorized());
	}

	@Test
	void meReturnsTheCallersCurrentPermissions() throws Exception {
		User user = givenUser("reception", Role.RECEPTIONIST);

		mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("reception")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("reception"))
				.andExpect(jsonPath("$.id").value(user.getId().toString()))
				.andExpect(jsonPath("$.permissions").isNotEmpty());
	}

	// ------------------------------------------------------ error envelopes

	@Test
	void aRequestWithNoTokenGetsAJsonEnvelopeNotAnEmptyBody() throws Exception {
		mockMvc.perform(get("/api/persons"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.errorCode").value("USER_401"))
				.andExpect(jsonPath("$.message").isNotEmpty())
				.andExpect(jsonPath("$.timestamp").isNotEmpty());
	}

	@Test
	void aGarbageTokenIsRefusedWithTheSameEnvelope() throws Exception {
		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-jwt"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.errorCode").value("USER_401"));
	}

	@Test
	void healthIsReachableWithoutAuthenticationForThePlatformProbe() throws Exception {
		mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
	}

	// ---------------------------------------------------------------- local

	private MvcResult verifyEmail(String token, org.springframework.test.web.servlet.ResultMatcher expected) throws Exception {
		return mockMvc.perform(post("/api/auth/email/verify")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new TokenBody(token))))
				.andExpect(expected)
				.andReturn();
	}

	private String tokenFromLastVerificationLink() {
		String url = mailer().lastVerification().orElseThrow(() -> new AssertionError("No verification link was sent")).url();

		return url.substring(url.indexOf("token=") + "token=".length());
	}

	private record TokenBody(String token) {}
}
