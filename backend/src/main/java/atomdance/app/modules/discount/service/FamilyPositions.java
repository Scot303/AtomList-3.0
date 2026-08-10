package atomdance.app.modules.discount.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.person.model.Person;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Decides which sibling counts as the first in the household, which the second, and so on.
 */
public final class FamilyPositions {

	private FamilyPositions() {
	}

	/**
	 * Works out where each person sits in their household's discount ladder, counting from 1.
	 *
	 * @param candidates    everybody the ladder has to account for, each appearing once.
	 * @param monthByPerson the memberships running in the month, by person, which is what the order is decided on
	 */
	public static Map<UUID, Integer> resolve(Collection<Person> candidates, Map<UUID, List<Membership>> monthByPerson) {
		Map<UUID, List<Person>> byFamily = new HashMap<>();
		Map<UUID, Integer> positions = new HashMap<>();

		for (Person person : candidates) {
			if (person.getFamily() == null) {
				positions.put(person.getId(), 1);

				continue;
			}

			byFamily.computeIfAbsent(person.getFamily().getId(), key -> new ArrayList<>()).add(person);
		}

		for (List<Person> members : byFamily.values()) {
			members.sort(byDiscountPriority(monthByPerson));

			for (int index = 0; index < members.size(); index++) {
				positions.put(members.get(index).getId(), index + 1);
			}
		}

		return positions;
	}

	/**
	 * Reshapes a flat set of memberships into the per-person map {@link #resolve} reads.
	 */
	public static Map<UUID, List<Membership>> byPerson(Collection<Membership> memberships) {
		Map<UUID, List<Membership>> byPerson = new HashMap<>();

		for (Membership membership : memberships) {
			byPerson.computeIfAbsent(membership.getPerson().getId(), key -> new ArrayList<>()).add(membership);
		}

		return byPerson;
	}

	/**
	 * Highest recurring charge first, then the longest-standing member.
	 */
	private static Comparator<Person> byDiscountPriority(Map<UUID, List<Membership>> monthByPerson) {
		return Comparator
				.comparing((Person person) -> monthlyBase(monthByPerson.get(person.getId())), Comparator.reverseOrder())
				.thenComparing(Person::getJoinedStudioAt, Comparator.nullsLast(LocalDate::compareTo))
				.thenComparing(Person::getCreatedAt, Comparator.nullsLast(Instant::compareTo))
				.thenComparing(person -> String.valueOf(person.getId()));
	}

	/**
	 * The recurring monthly charge, which is what the family order is decided on.
	 */
	private static BigDecimal monthlyBase(List<Membership> memberships) {
		if (memberships == null) {
			return Money.ZERO;
		}

		BigDecimal total = Money.ZERO;

		for (Membership membership : memberships) {
			if (!membership.getGroup().isPerClass()) {
				total = Money.add(total, Money.normalize(membership.resolveUnitCost()));
			}
		}

		return total;
	}
}
