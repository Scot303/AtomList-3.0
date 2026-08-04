package atomdance.app.modules.person.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateFamilyRequest(

		@NotBlank(message = "Family name is required")
		@Size(max = 64, message = "Family name is too long")
		String name,

		@Size(max = 9, message = "Phone number is too long")
		String phone,

		@Email(message = "Email is not a valid address")
		@Size(max = 255, message = "Email is too long")
		String email,

		@Size(max = 512, message = "Note is too long")
		String note,

		List<UUID> memberIds
) {}
