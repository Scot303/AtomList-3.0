package atomdance.app.modules.user.dto;

import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;

import java.time.Instant;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

public record AdminUserView(
		UUID id,
		String username,
		String email,
		Role role,
		Set<String> additionalPermissions,
		Set<String> effectivePermissions,
		boolean active,
		boolean emailVerified,
		boolean locked,
		Instant lockedUntil,
		int failedLoginAttempts,
		Instant lastLoginAt
) {

	public static AdminUserView from(User user, Instant now) {
		return new AdminUserView(
				user.getId(),
				user.getUsername(),
				user.getEmail(),
				user.getRole(),
				names(user.getAdditionalPermissions()),
				names(user.getAllPermissions()),
				user.isActive(),
				user.isEmailVerified(),
				user.isLockedAt(now),
				user.getLockedUntil(),
				user.getFailedLoginAttempts(),
				user.getLastLoginAt()
		);
	}

	private static Set<String> names(Set<Permission> permissions) {
		Set<String> names = new TreeSet<>();

		for (Permission permission : permissions) {
			names.add(permission.name());
		}

		return names;
	}
}
