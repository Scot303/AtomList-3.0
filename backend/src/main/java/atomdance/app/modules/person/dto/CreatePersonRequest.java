package atomdance.app.modules.person.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;


public record CreatePersonRequest(

		@NotBlank(message = "First name is required")
		@Size(max = 64, message = "First name is too long")
		String name,

		@NotBlank(message = "Last name is required")
		@Size(max = 64, message = "Last name is too long")
		String lastName,

		@Size(max = 9, message = "Phone number is too long")
		String phone,

		@Email(message = "Email is not a valid address")
		@Size(max = 255, message = "Email is too long")
		String email,

		@Past(message = "Date of birth must be in the past")
		LocalDate dateOfBirth,

		LocalDate joinedStudioAt,

		LocalDate joinedClubDate,

		LocalDate leftClubDate,

		Boolean contractSigned,

		Boolean studentDiscount,

		UUID familyId,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
