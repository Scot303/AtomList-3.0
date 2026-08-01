package atomdance.app.modules.user.dto;

import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import jakarta.validation.constraints.*;

import java.util.Set;

public record CreateUserRequest(

		@NotBlank(message = "Username is required")
		@Size(min = 3, max = 64, message = "Username must be between 3 and 64 characters")
		@Pattern(regexp = "^[\\p{L}\\p{N}._-]+$", message = "Username may only contain letters, digits, dots, underscores and hyphens")
		String username,

		@NotBlank(message = "Email is required")
		@Email(message = "Email is not a valid address")
		@Size(max = 255, message = "Email is too long")
		String email,

		@NotNull(message = "Role is required")
		Role role,

		Set<Permission> additionalPermissions
) {}
