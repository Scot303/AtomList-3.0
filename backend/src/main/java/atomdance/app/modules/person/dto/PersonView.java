package atomdance.app.modules.person.dto;

import atomdance.app.modules.person.model.Person;

import java.time.LocalDate;
import java.util.UUID;

public record PersonView(
		UUID id,
		String name,
		String lastName,
		String fullName,
		String phone,
		String effectivePhone,
		String email,
		LocalDate dateOfBirth,
		LocalDate joinedStudioAt,
		boolean active,
		boolean contractSigned,
		UUID familyId,
		String familyName,
		String note
) {

	public static PersonView from(Person person) {
		return new PersonView(
				person.getId(),
				person.getName(),
				person.getLastName(),
				person.getFullName(),
				person.getPhone(),
				person.getEffectivePhone(),
				person.getEmail(),
				person.getDateOfBirth(),
				person.getJoinedStudioAt(),
				person.isActive(),
				person.isContractSigned(),
				person.getFamily() == null ? null : person.getFamily().getId(),
				person.getFamily() == null ? null : person.getFamily().getName(),
				person.getNote()
		);
	}
}
