package atomdance.app.modules.person.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateFamilyRequest(

		@Size(min = 1, max = 128, message = "Family name must be between 1 and 128 characters")
		String name,

		@Size(max = 9, message = "Phone number is too long")
		String phone,

		@Email(message = "Email is not a valid address")
		@Size(max = 255, message = "Email is too long")
		String email,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
