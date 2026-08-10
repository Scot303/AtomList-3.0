package atomdance.app.modules.person.dto;

import atomdance.app.modules.person.model.Person;

import java.time.LocalDate;
import java.util.Set;
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
		Set<UUID> groupIds,
		String note
) {

	/**
	 * Without groups, for callers that have no use for them.
	 */
	public static PersonView from(Person person) {
		return from(person, Set.of());
	}

	public static PersonView from(Person person, Set<UUID> groupIds) {
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
				groupIds,
				person.getNote()
		);
	}
}
