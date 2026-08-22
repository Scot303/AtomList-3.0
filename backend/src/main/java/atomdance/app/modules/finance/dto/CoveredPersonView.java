package atomdance.app.modules.finance.dto;

import atomdance.app.modules.person.model.Person;

import java.util.UUID;


/**
 * One of the people a handover was for, as the money screens name them.
 */
public record CoveredPersonView(
		UUID id,
		String name,
		String lastName,
		String fullName,
		String phone
) {

	public static CoveredPersonView from(Person person) {
		return new CoveredPersonView(
				person.getId(),
				person.getName(),
				person.getLastName(),
				person.getFullName(),
				person.getEffectivePhone()
		);
	}
}
