package atomdance.app.modules.person.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUpdateFamilyRequest(

		@NotBlank(message = "Family name is required")
		@Size(max = 128, message = "Family name is too long")
		String name,

		@Size(max = 9, message = "Phone number is too long")
		String phone,

		@Size(max = 512, message = "Note is too long")
		String note

) {}
