package atomdance.app;

import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;
import atomdance.app.support.AuthIntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Accounts are created and repaired by an administrator - there is no self-registration anywhere -
 * so this surface is the only route in. Most of what is asserted here is the guard rails: the ways
 * an administrator could otherwise leave the system with nobody able to administer it.
 */
class AdminUserManagementIntegrationTest extends AuthIntegrationTestBase {

	@Test
	void creatingAnAccountSendsAVerificationLinkAndNoCredential() throws Exception {
		givenUser("admin", Role.ADMIN);
		String token = signInAndGetToken("admin");

		mailer().clear();

		MvcResult created = mockMvc.perform(post("/api/admin/users")
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"username":"newcomer","email":"Newcomer@Example.COM","role":"EMPLOYEE"}"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.emailVerified").value(false))
				.andExpect(jsonPath("$.active").value(true))
				.andExpect(jsonPath("$.email").value("newcomer@example.com"))
				.andReturn();

		assertThat(mailer().lastVerification()).isPresent();
		assertThat(mailer().lastVerification().orElseThrow().email()).isEqualTo("newcomer@example.com");
		assertThat(created.getResponse().getContentAsString()).doesNotContain("password");
	}

	@Test
	void aDuplicateUsernameOrAddressIsRefused() throws Exception {
		givenUser("admin", Role.ADMIN);
		givenUser("taken", Role.EMPLOYEE);
		String token = signInAndGetToken("admin");

		createUser(token, """
				{"username":"TAKEN","email":"other@example.com","role":"EMPLOYEE"}""", status().isBadRequest());

		createUser(token, """
				{"username":"other","email":"TAKEN@example.com","role":"EMPLOYEE"}""", status().isBadRequest());
	}

	@Test
	void theUserListCarriesTheDiagnosticsAnAdminNeeds() throws Exception {
		givenUser("admin", Role.ADMIN);
		givenUser("locked-out", Role.EMPLOYEE);

		mockMvc.perform(get("/api/admin/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("admin")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].locked").exists())
				.andExpect(jsonPath("$[0].emailVerified").exists());
	}

	@Test
	void anAdminCanUnlockSomebodyWithoutMakingThemWaitOutTheLockout() throws Exception {
		givenUser("admin", Role.ADMIN);
		User target = givenUser("stuck", Role.EMPLOYEE);
		String adminToken = signInAndGetToken("admin");

		target.setLockedUntil(java.time.Instant.now().plusSeconds(3600));
		target.setFailedLoginAttempts(5);
		userRepository.saveAndFlush(target);

		mockMvc.perform(post("/api/admin/users/{id}/unlock", target.getId())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.locked").value(false))
				.andExpect(jsonPath("$.failedLoginAttempts").value(0));

		signIn("stuck");
	}

	@Test
	void changingSomebodysAddressUnverifiesItAndEndsTheirSessions() throws Exception {
		givenUser("admin", Role.ADMIN);
		User target = givenUser("mover", Role.EMPLOYEE);

		String adminToken = signInAndGetToken("admin");
		String targetToken = signInAndGetToken("mover");

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
				.andExpect(status().isOk());

		mailer().clear();

		mockMvc.perform(patch("/api/admin/users/{id}", target.getId())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"email":"moved@example.com"}"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("moved@example.com"))
				.andExpect(jsonPath("$.emailVerified").value(false));

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
				.andExpect(status().isUnauthorized());

		assertThat(mailer().lastVerification().orElseThrow().email()).isEqualTo("moved@example.com");
	}

	@Test
	void aVerificationLinkStopsWorkingOnceTheAddressHasMovedOn() throws Exception {
		givenUser("admin", Role.ADMIN);
		User target = givenUser("mover", Role.EMPLOYEE, true, false);
		String adminToken = signInAndGetToken("admin");

		requestCode("mover");
		String staleToken = tokenFromLastVerificationLink();

		mockMvc.perform(patch("/api/admin/users/{id}", target.getId())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"email":"corrected@example.com"}"""))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/auth/email/verify")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new TokenBody(staleToken))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errorCode").value("INVALID_VERIFICATION_TOKEN_400"));
	}

	@Test
	void changingAPermissionSetTakesEffectWithoutWaitingForTheTokenToExpire() throws Exception {
		givenUser("admin", Role.ADMIN);
		User target = givenUser("reception", Role.RECEPTIONIST);

		String adminToken = signInAndGetToken("admin");
		String targetToken = signInAndGetToken("reception");

		mockMvc.perform(createPerson(targetToken))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/admin/users/{id}", target.getId())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"additionalPermissions":["MODIFY_PERSONS"]}"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.effectivePermissions", org.hamcrest.Matchers.hasItem("MODIFY_PERSONS")));

		mockMvc.perform(createPerson(targetToken))
				.andExpect(status().isUnauthorized());

		mockMvc.perform(createPerson(signInAndGetToken("reception")))
				.andExpect(status().isCreated());
	}

	private MockHttpServletRequestBuilder createPerson(String token) {
		return post("/api/persons")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Anna","lastName":"Kowalska"}""");
	}

	@Test
	void forceLogoutEndsEverySessionWithoutTouchingTheAccount() throws Exception {
		givenUser("admin", Role.ADMIN);
		User target = givenUser("careless", Role.EMPLOYEE);

		String adminToken = signInAndGetToken("admin");
		String targetToken = signInAndGetToken("careless");

		mockMvc.perform(post("/api/admin/users/{id}/force-logout", target.getId())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/persons").header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken))
				.andExpect(status().isUnauthorized());

		signIn("careless");
	}

	// ------------------------------------------------------------ guard rails

	@Test
	void anAdminCannotDeactivateThemselves() throws Exception {
		User admin = givenUser("admin", Role.ADMIN);
		givenUser("spare", Role.ADMIN);

		patchSelf(admin.getId(), """
				{"active":false}""", status().isBadRequest());
	}

	@Test
	void anAdminCannotChangeTheirOwnRole() throws Exception {
		User admin = givenUser("admin", Role.ADMIN);
		givenUser("spare", Role.ADMIN);

		patchSelf(admin.getId(), """
				{"role":"EMPLOYEE"}""", status().isBadRequest());
	}

	@Test
	void anAdminCannotChangeTheirOwnPermissions() throws Exception {
		User admin = givenUser("admin", Role.ADMIN);

		patchSelf(admin.getId(), """
				{"additionalPermissions":[]}""", status().isBadRequest());
	}

	@Test
	void theLastAdministratorCannotBeDemotedOrDeactivated() throws Exception {
		givenUser("admin", Role.ADMIN);
		User onlyOtherAdmin = givenUser("second", Role.ADMIN);
		String token = signInAndGetToken("admin");

		// Two administrators, so removing one is allowed.
		mockMvc.perform(patch("/api/admin/users/{id}", onlyOtherAdmin.getId())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{"role":"MANAGER"}"""))
				.andExpect(status().isOk());

		// The caller is now the last one, and no route may remove them - not even their own.
		patchSelf(userRepository.findByUsername("admin").orElseThrow().getId(), """
				{"active":false}""", status().isBadRequest());
	}

	@Test
	void aNonAdministratorCannotReachAnyOfThis() throws Exception {
		givenUser("reception", Role.RECEPTIONIST);

		mockMvc.perform(get("/api/admin/users").header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("reception")))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED_403"));
	}

	@Test
	void anAnonymousCallerCannotReachAnyOfThis() throws Exception {
		mockMvc.perform(get("/api/admin/users"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void resendingVerificationForAnAlreadyConfirmedAddressIsRefused() throws Exception {
		givenUser("admin", Role.ADMIN);
		User target = givenUser("settled", Role.EMPLOYEE);

		mockMvc.perform(post("/api/admin/users/{id}/resend-verification", target.getId())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("admin")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errorCode").value("INVALID_OPERATION"));
	}

	@Test
	void anUnknownAccountIsAFourOhFour() throws Exception {
		givenUser("admin", Role.ADMIN);

		mockMvc.perform(get("/api/admin/users/{id}", UUID.randomUUID())
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("admin")))
				.andExpect(status().isNotFound());
	}

	// ---------------------------------------------------------------- local

	private void createUser(String token, String body, ResultMatcher expected) throws Exception {
		mockMvc.perform(post("/api/admin/users")
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(expected);
	}

	private void patchSelf(UUID adminId, String body, ResultMatcher expected) throws Exception {
		mockMvc.perform(patch("/api/admin/users/{id}", adminId)
						.header(HttpHeaders.AUTHORIZATION, "Bearer " + signInAndGetToken("admin"))
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(expected);
	}

	private String tokenFromLastVerificationLink() {
		String url = mailer().lastVerification().orElseThrow(() -> new AssertionError("No verification link was sent")).url();

		return url.substring(url.indexOf("token=") + "token=".length());
	}

	private record TokenBody(String token) {}
}
