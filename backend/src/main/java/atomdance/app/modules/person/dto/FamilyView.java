package atomdance.app.modules.person.dto;

import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record FamilyView(
		UUID id,
		String name,
		String phone,
		String email,
		String note,
		String displayName,
		int memberCount,
		List<PersonView> members
) {

	public static FamilyView from(Family family) {
		List<Person> ordered = family.getPersons().stream()
				.sorted(Comparator.comparing(Person::getName, String.CASE_INSENSITIVE_ORDER).thenComparing(Person::getLastName, String.CASE_INSENSITIVE_ORDER))
				.toList();

		return new FamilyView(
				family.getId(),
				family.getName(),
				family.getPhone(),
				family.getEmail(),
				family.getNote(),
				displayName(family.getName(), ordered),
				ordered.size(),
				ordered.stream().map(PersonView::from).toList()
		);
	}

	static String displayName(String familyName, List<Person> members) {
		if (members.isEmpty()) {
			return familyName;
		}

		return familyName + " (" + members.stream().map(Person::getName).collect(Collectors.joining(", ")) + ")";
	}
}
