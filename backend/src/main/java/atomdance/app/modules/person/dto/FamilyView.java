package atomdance.app.modules.person.dto;

import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

public record FamilyView(
		UUID id,
		String name,
		String phone,
		String note,
		List<FamilyMemberView> members
) {

	private static final Comparator<Person> BY_NAME = Comparator
			.comparing(Person::getName, String.CASE_INSENSITIVE_ORDER)
			.thenComparing(Person::getLastName, String.CASE_INSENSITIVE_ORDER);


	public static FamilyView of(Family family, Function<Person, FamilyMemberView> toMember) {
		return new FamilyView(
				family.getId(),
				family.getName(),
				family.getPhone(),
				family.getNote(),
				family.getPersons().stream()
						.sorted(BY_NAME)
						.map(toMember)
						.toList()
		);
	}
}
