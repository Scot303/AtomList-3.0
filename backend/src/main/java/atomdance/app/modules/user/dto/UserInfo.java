package atomdance.app.modules.user.dto;

import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;

import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

public record UserInfo(
		UUID id,
		String username,
		String email,
		Role role,
		Set<String> permissions,
		boolean emailVerified
) {

	public static UserInfo from(User user) {
		Set<String> permissions = new TreeSet<>();

		for (Permission permission : user.getAllPermissions()) {
			permissions.add(permission.name());
		}

		return new UserInfo(
				user.getId(),
				user.getUsername(),
				user.getEmail(),
				user.getRole(),
				permissions,
				user.isEmailVerified()
		);
	}
}
