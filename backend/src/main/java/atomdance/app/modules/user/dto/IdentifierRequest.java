package atomdance.app.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IdentifierRequest(

		@NotBlank(message = "Username or email is required")
		@Size(max = 255, message = "Username or email is too long")
		String identifier
) {}
