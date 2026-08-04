package atomdance.app.modules.user.service;

import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * The converter is the only place authorities are established, so these cover the whole authorization surface:
 * what a caller ends up holding, and every reason a structurally valid token is still refused.
 */
@ExtendWith(MockitoExtension.class)
class JwtUserAuthenticationConverterTest {

	private static final UUID USER_ID = UUID.fromString("11111111-2222-3333-4444-555555555555");

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private JwtUserAuthenticationConverter converter;

	@Test
	void grantsEveryRolePermissionAsABareAuthority() {
		givenUser(user(Role.RECEPTIONIST, Set.of(), 0, true));

		Set<String> authorities = authoritiesFrom(token(USER_ID.toString(), 0));

		assertThat(authorities).containsAll(
				Role.RECEPTIONIST.getPermissions().stream().map(Enum::name).collect(Collectors.toSet())
		);

		assertThat(authorities).contains("READ_PAYMENTS").doesNotContain("SCOPE_READ_PAYMENTS");
	}

	@Test
	void grantsTheRoleUnderSpringsRolePrefix() {
		givenUser(user(Role.MANAGER, Set.of(), 0, true));

		assertThat(authoritiesFrom(token(USER_ID.toString(), 0))).contains("ROLE_MANAGER");
	}

	@Test
	void unionsIndividuallyGrantedPermissionsOnTopOfTheRole() {
		givenUser(user(Role.RECEPTIONIST, EnumSet.of(Permission.MODIFY_PAYMENTS), 0, true));

		Set<String> authorities = authoritiesFrom(token(USER_ID.toString(), 0));

		assertThat(authorities)
				.contains("MODIFY_PAYMENTS")   // granted individually
				.contains("READ_PERSONS");     // still has everything the role gives
	}

	@Test
	void adminHoldsEveryPermission() {
		givenUser(user(Role.ADMIN, Set.of(), 0, true));

		Set<String> authorities = authoritiesFrom(token(USER_ID.toString(), 0));

		assertThat(authorities).containsAll(
				EnumSet.allOf(Permission.class).stream().map(Enum::name).collect(Collectors.toSet())
		);
	}

	@Test
	void rejectsADeactivatedAccount() {
		givenUser(user(Role.ADMIN, Set.of(), 0, false));

		// The token itself is perfectly valid - this is what stops a deactivation from waiting out the remaining access-token lifetime.
		assertThatThrownBy(() -> converter.convert(token(USER_ID.toString(), 0)))
				.isInstanceOf(InvalidBearerTokenException.class);
	}

	@Test
	void rejectsATokenMintedBeforeTheLastSessionInvalidation() {
		givenUser(user(Role.ADMIN, Set.of(), 3, true));

		assertThatThrownBy(() -> converter.convert(token(USER_ID.toString(), 2)))
				.isInstanceOf(InvalidBearerTokenException.class);
	}

	@Test
	void acceptsAMatchingTokenVersion() {
		givenUser(user(Role.ADMIN, Set.of(), 3, true));

		assertThat(converter.convert(token(USER_ID.toString(), 3))).isNotNull();
	}

	@Test
	void rejectsATokenForADeletedAccount() {
		when(userRepository.findByIdWithPermissions(any())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> converter.convert(token(USER_ID.toString(), 0)))
				.isInstanceOf(InvalidBearerTokenException.class);
	}

	@Test
	void rejectsASubjectThatIsNotAUuid() {
		// Guards the Long-to-UUID migration: a token from the old scheme carried a numeric subject.
		assertThatThrownBy(() -> converter.convert(token("42", 0)))
				.isInstanceOf(InvalidBearerTokenException.class);
	}

	@Test
	void rejectsAMissingTokenVersionClaim() {
		givenUser(user(Role.ADMIN, Set.of(), 0, true));

		Jwt jwt = Jwt.withTokenValue("t")
				.header("alg", "HS256")
				.subject(USER_ID.toString())
				.issuedAt(Instant.now())
				.expiresAt(Instant.now().plusSeconds(600))
				.build();

		assertThatThrownBy(() -> converter.convert(jwt)).isInstanceOf(InvalidBearerTokenException.class);
	}

	@Test
	void namesThePrincipalByUsername() {
		givenUser(user(Role.EMPLOYEE, Set.of(), 0, true));

		assertThat(converter.convert(token(USER_ID.toString(), 0)).getName()).isEqualTo("dancer");
	}

	private void givenUser(User user) {
		when(userRepository.findByIdWithPermissions(USER_ID)).thenReturn(Optional.of(user));
	}

	private Set<String> authoritiesFrom(Jwt jwt) {
		return converter.convert(jwt).getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.collect(Collectors.toSet());
	}

	private static User user(Role role, Set<Permission> additional, int tokenVersion, boolean active) {
		return User.builder()
				.id(USER_ID)
				.username("dancer")
				.email("dancer@example.com")
				.role(role)
				.additionalPermissions(additional)
				.tokenVersion(tokenVersion)
				.isActive(active)
				.build();
	}

	/**
	 * The token-version claim is written as an {@code int} but arrives from a real decoder as a
	 * {@code Number}, so it is deliberately boxed here rather than passed as a primitive.
	 */
	private static Jwt token(String subject, int tokenVersion) {
		return Jwt.withTokenValue("token")
				.header("alg", "HS256")
				.subject(subject)
				.claim(JwtService.USERNAME_CLAIM, "dancer")
				.claim(JwtService.TOKEN_VERSION_CLAIM, Integer.valueOf(tokenVersion))
				.issuedAt(Instant.now())
				.expiresAt(Instant.now().plusSeconds(600))
				.build();
	}
}
