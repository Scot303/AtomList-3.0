package atomdance.app.modules.person.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;


public record UpdatePersonRequest(

		@Size(min = 1, max = 64, message = "First name must be between 1 and 128 characters")
		String name,

		@Size(min = 1, max = 64, message = "Last name must be between 1 and 128 characters")
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

		Boolean clearJoinedClubDate,

		LocalDate leftClubDate,

		Boolean clearLeftClubDate,

		Boolean active,

		Boolean contractSigned,

		Boolean studentDiscount,

		UUID familyId,

		Boolean clearFamily,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
