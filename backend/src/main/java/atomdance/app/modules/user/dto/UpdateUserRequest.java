package atomdance.app.modules.user.dto;

import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UpdateUserRequest(

		@Email(message = "Email is not a valid address")
		@Size(max = 255, message = "Email is too long")
		String email,

		Role role,

		Set<Permission> additionalPermissions,

		Boolean active
) {}
