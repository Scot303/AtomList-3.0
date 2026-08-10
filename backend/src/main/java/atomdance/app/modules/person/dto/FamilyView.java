package atomdance.app.modules.person.dto;

import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record FamilyView(
		UUID id,
		String name,
		String phone,
		String note,
		Set<UUID> memberIds
) {

	public static FamilyView from(Family family) {
		return new FamilyView(
				family.getId(),
				family.getName(),
				family.getPhone(),
				family.getNote(),
				family.getPersons().stream()
						.sorted(Comparator.comparing(Person::getName, String.CASE_INSENSITIVE_ORDER).thenComparing(Person::getLastName, String.CASE_INSENSITIVE_ORDER))
						.map(Person::getId)
						.collect(Collectors.toCollection(LinkedHashSet::new))
		);
	}
}
