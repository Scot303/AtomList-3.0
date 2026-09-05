package atomdance.app.modules.person.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.discount.dto.ScopeSplit;
import atomdance.app.modules.discount.service.ChargedMemberships;
import atomdance.app.modules.discount.service.DiscountRules;
import atomdance.app.modules.discount.service.DiscountService;
import atomdance.app.modules.discount.service.FamilyPositions;
import atomdance.app.modules.group.model.Group;
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
 * Explains one person's discount for a month, and prices the memberships it applies to.
 */
@Service
@RequiredArgsConstructor
public class PersonDiscountService {

	private static final int EARLIEST_YEAR = 2020;
	private static final int LATEST_YEAR = 2100;

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


	/**
	 * @param year  the calendar year of the month to price
	 * @param month the month to price, 1 for January
	 */
	@Transactional(readOnly = true)
	public PersonDiscountView preview(UUID personId, int year, int month) {
		return preview(personId, yearMonth(year, month));
	}


	@Transactional(readOnly = true)
	public PersonDiscountView preview(UUID personId, YearMonth month) {
		Person person = personRepository.findByIdWithFamily(personId)
				.orElseThrow(() -> new NotFoundException("entity.person"));

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

		// One row per group: having left and rejoined within the month is one charge, exactly as the sheet bills it.
		List<PersonDiscountView.CountedMembership> lines = new ArrayList<>();
		ScopeSplit totals = ScopeSplit.zero();

		for (Membership membership : ChargedMemberships.oneMembershipPerGroup(running)) {
			PersonDiscountView.CountedMembership line = countedMembership(membership, month, total);

			lines.add(line);

			// A per-class group is billed by attendance nobody has recorded yet, so it belongs in the list but not in the totals.
			if (!line.perClass()) {
				totals = totals.plus(membership.getGroup().getType(), line.asScope());
			}
		}

		auditLogger.read(AuditEventType.DISCOUNT_PREVIEW, personId, "Previewed the discount calculation of %s for %s.", person.getFullName(), month);

		return new PersonDiscountView(
				person.getId(),
				person.getFullName(),
				month.getYear(),
				month.getMonthValue(),
				person.isActive(),
				billed,
				householdView(person, household, positions, monthByPerson),
				lines,
				totals,
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


	/**
	 * One group's charge, discounted exactly as its payment line is - the percentage taken off each row rather than off the total.
	 *
	 * @param percent the person's combined discount for the month
	 */
	private static PersonDiscountView.CountedMembership countedMembership(Membership membership, YearMonth month, BigDecimal percent) {
		Group group = membership.getGroup();
		boolean perClass = group.isPerClass();

		BigDecimal unitCost = Money.normalize(membership.resolveUnitCostFor(month));
		BigDecimal gross = perClass ? Money.ZERO : unitCost;
		BigDecimal discountAmount = Money.percentOf(gross, percent);

		return new PersonDiscountView.CountedMembership(
				membership.getId(),
				group.getId(),
				group.getName(),
				group.getType(),
				perClass,
				unitCost,
				gross,
				discountAmount,
				Money.atLeastZero(Money.subtract(gross, discountAmount)),
				membership.isActive(),
				ChargedMemberships.isCharged(membership, month)
		);
	}


	/**
	 * A month somebody could plausibly have been billed in. Out of range is a broken request.
	 */
	private static YearMonth yearMonth(int year, int month) {
		if (month < 1 || month > 12 || year < EARLIEST_YEAR || year > LATEST_YEAR) {
			throw new InvalidOperationException("error.invalid_month");
		}

		return YearMonth.of(year, month);
	}
}
