package atomdance.app.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyLoginCodeRequest(

		@NotBlank(message = "Username or email is required")
		@Size(max = 255, message = "Username or email is too long")
		String identifier,

		@NotBlank(message = "Code is required")
		@Size(max = 128, message = "Code is too long")
		String code
) {}
