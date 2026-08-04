package atomdance.app.modules.user.model;

import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserPermissionsTest {

	@Test
	void adminHoldsEveryDefinedPermission() {
		assertThat(Role.ADMIN.getPermissions()).containsExactlyInAnyOrderElementsOf(EnumSet.allOf(Permission.class));
	}

	@Test
	void rolesInheritTheirBase() {
		assertThat(Role.MANAGER.getPermissions()).containsAll(Role.EMPLOYEE.getPermissions());
		assertThat(Role.EMPLOYEE.getPermissions()).containsAll(Role.RECEPTIONIST.getPermissions());
	}

	@Test
	void aRolesPermissionSetCannotBeMutatedByACaller() {
		assertThatThrownBy(() -> Role.RECEPTIONIST.getPermissions().add(Permission.MANAGE_USERS))
				.isInstanceOf(UnsupportedOperationException.class);
	}

	@Test
	void effectivePermissionsCombineRoleAndIndividualGrants() {
		User user = User.builder()
				.role(Role.RECEPTIONIST)
				.additionalPermissions(EnumSet.of(Permission.VIEW_STATS))
				.build();

		assertThat(user.getAllPermissions())
				.contains(Permission.VIEW_STATS)
				.containsAll(Role.RECEPTIONIST.getPermissions());
	}

	@Test
	void effectivePermissionsAreReadOnlyAndDoNotLeakIntoTheRole() {
		User user = User.builder().role(Role.RECEPTIONIST).additionalPermissions(Set.of()).build();

		assertThatThrownBy(() -> user.getAllPermissions().add(Permission.MANAGE_USERS))
				.isInstanceOf(UnsupportedOperationException.class);

		assertThat(Role.RECEPTIONIST.getPermissions()).doesNotContain(Permission.MANAGE_USERS);
	}

	@Test
	void anIndividualGrantDoesNotWidenTheRoleForOtherUsers() {
		User privileged = User.builder()
				.role(Role.RECEPTIONIST)
				.additionalPermissions(EnumSet.of(Permission.MANAGE_USERS))
				.build();

		User ordinary = User.builder()
				.role(Role.RECEPTIONIST)
				.additionalPermissions(EnumSet.noneOf(Permission.class))
				.build();

		assertThat(privileged.getAllPermissions()).contains(Permission.MANAGE_USERS);
		assertThat(ordinary.getAllPermissions()).doesNotContain(Permission.MANAGE_USERS);
	}

	@Test
	void newUsersAreActiveByDefault() {
		assertThat(User.builder().role(Role.RECEPTIONIST).build().isActive()).isTrue();
		assertThat(User.builder().role(Role.RECEPTIONIST).build().getTokenVersion()).isZero();
	}
}
