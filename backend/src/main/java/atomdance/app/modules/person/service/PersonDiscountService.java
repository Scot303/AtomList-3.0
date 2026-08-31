package atomdance.app.modules.person.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.discount.service.ChargedMemberships;
import atomdance.app.modules.discount.service.DiscountRules;
import atomdance.app.modules.discount.service.DiscountService;
import atomdance.app.modules.discount.service.FamilyPositions;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.dto.PersonDiscountView;
import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.FamilyRepository;
import atomdance.app.modules.person.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.*;


/**
 * Explains one person's discount for the current month.
 */
@Service
@RequiredArgsConstructor
public class PersonDiscountService {

	/**
	 * Somebody who holds no position sorts to the bottom of the household, below everybody who does.
	 */
	private static final Comparator<PersonDiscountView.Sibling> BY_LADDER_ORDER = Comparator
			.comparing(PersonDiscountView.Sibling::position, Comparator.nullsLast(Integer::compareTo))
			.thenComparing(PersonDiscountView.Sibling::fullName, String.CASE_INSENSITIVE_ORDER);

	private final PersonRepository personRepository;
	private final FamilyRepository familyRepository;
	private final MembershipRepository membershipRepository;
	private final DiscountService discountService;
	private final AuditLogger auditLogger;
	private final AppClock clock;


	@Transactional(readOnly = true)
	public PersonDiscountView preview(UUID personId) {
		Person person = personRepository.findByIdWithFamily(personId)
				.orElseThrow(() -> new NotFoundException("entity.person"));

		YearMonth month = clock.currentYearMonth();
		List<Person> household = householdOf(person);

		Map<UUID, List<Membership>> monthByPerson = FamilyPositions.byPerson(membershipRepository.findActiveDuringForPersons(
				household.stream().map(Person::getId).toList(),
				month.atDay(1),
				month.atEndOfMonth()
		));

		// Anybody inactive is not being charged, and of the rest the ladder itself leaves out whoever is billed nothing this month.
		List<Person> billedMembers = household.stream()
				.filter(Person::isActive)
				.toList();

		Map<UUID, Integer> positions = FamilyPositions.resolve(billedMembers, monthByPerson, month);

		Integer position = positions.get(personId);
		boolean billed = position != null;

		// Everything running this month, whether or not it counts: a group somebody pays nothing for is still shown, just not counted.
		List<Membership> running = monthByPerson.getOrDefault(personId, List.of());
		int groupCount = ChargedMemberships.groupCount(running, month);

		DiscountRules rules = discountService.currentRules();

		boolean student = person.isStudentDiscount();

		BigDecimal familyPercent = billed ? rules.familyPercent(position) : Money.ZERO;
		BigDecimal groupCountPercent = billed ? rules.groupCountPercent(groupCount) : Money.ZERO;
		BigDecimal studentPercent = billed ? rules.studentPercent(student) : Money.ZERO;
		BigDecimal total = billed ? rules.combinedPercent(position, groupCount, student) : Money.ZERO;

		auditLogger.read(AuditEventType.DISCOUNT_PREVIEW, personId, "Previewed the discount calculation of %s.", person.getFullName());

		return new PersonDiscountView(
				person.getId(),
				person.getFullName(),
				month.getYear(),
				month.getMonthValue(),
				person.isActive(),
				billed,
				householdView(person, household, positions, monthByPerson),
				running.stream().map(membership -> countedMembership(membership, month)).toList(),
				component(billed ? position : null, familyPercent, rules.familyLadder(), billed ? rules.familyThreshold(position) : null),
				component(billed ? groupCount : null, groupCountPercent, rules.groupCountLadder(), billed ? rules.groupCountThreshold(groupCount) : null),
				student,
				studentPercent,
				total,
				Money.isGreaterThan(Money.add(Money.add(familyPercent, groupCountPercent), studentPercent), total)
		);
	}


	/**
	 * Everybody whose position competes with this person's, which is their household, or only themselves when they have none.
	 */
	private List<Person> householdOf(Person person) {
		Family family = person.getFamily();

		if (family == null) {
			return List.of(person);
		}

		List<Person> members = familyRepository.findByIdWithPersons(family.getId())
				.map(Family::getPersons)
				.orElseGet(List::of);

		if (members.stream().noneMatch(member -> member.getId().equals(person.getId()))) {
			List<Person> withSelf = new ArrayList<>(members);
			withSelf.add(person);

			return withSelf;
		}

		return members;
	}


	/**
	 * The household as the ladder ordered it. Null for somebody with no family.
	 */
	private static PersonDiscountView.Household householdView(Person person, List<Person> household, Map<UUID, Integer> positions, Map<UUID, List<Membership>> monthByPerson) {
		Family family = person.getFamily();

		if (family == null) {
			return null;
		}

		List<PersonDiscountView.Sibling> members = new ArrayList<>();

		for (Person member : household) {
			Integer position = positions.get(member.getId());

			members.add(new PersonDiscountView.Sibling(
					member.getId(),
					member.getFullName(),
					position,
					position == null ? null : FamilyPositions.monthlyBase(monthByPerson.get(member.getId())),
					member.getId().equals(person.getId())
			));
		}

		members.sort(BY_LADDER_ORDER);

		return new PersonDiscountView.Household(family.getId(), family.getName(), members);
	}


	/**
	 * @param input null when nothing is being charged, so the ladder was never consulted.
	 */
	private static PersonDiscountView.Component component(Integer input, BigDecimal percent, NavigableMap<Integer, BigDecimal> ladder, Integer matchedThreshold) {
		List<PersonDiscountView.Rung> rungs = ladder.entrySet().stream()
				.map(rung -> new PersonDiscountView.Rung(
						rung.getKey(),
						Money.normalize(rung.getValue()),
						rung.getKey().equals(matchedThreshold)
				))
				.toList();

		return new PersonDiscountView.Component(input, matchedThreshold, Money.normalize(percent), rungs);
	}


	private static PersonDiscountView.CountedMembership countedMembership(Membership membership, YearMonth month) {
		boolean perClass = membership.getGroup().isPerClass();

		return new PersonDiscountView.CountedMembership(
				membership.getId(),
				membership.getGroup().getId(),
				membership.getGroup().getName(),
				perClass,
				perClass ? null : Money.normalize(membership.resolveUnitCost()),
				membership.isActive(),
				ChargedMemberships.isCharged(membership, month)
		);
	}
}
