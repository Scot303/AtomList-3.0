package atomdance.app.modules.person.dto;

import atomdance.app.modules.person.model.Person;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * A household member as the family view shows them: who they are and what they attend.
 *
 * @param groupIds the groups they are currently attending, in group-name order.
 */
public record FamilyMemberView(
		UUID id,
		String name,
		String lastName,
		String fullName,
		LocalDate dateOfBirth,
		String phone,
		String effectivePhone,
		boolean active,
		Set<UUID> groupIds
) {

	public static FamilyMemberView of(Person person, Set<UUID> groupIds) {
		return new FamilyMemberView(
				person.getId(),
				person.getName(),
				person.getLastName(),
				person.getFullName(),
				person.getDateOfBirth(),
				person.getPhone(),
				person.getEffectivePhone(),
				person.isActive(),
				groupIds
		);
	}
}
