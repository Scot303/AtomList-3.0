package atomdance.app.modules.finance.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.discount.service.DiscountRules;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentLine;
import atomdance.app.modules.finance.model.PaymentLineKind;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.person.model.Person;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Turns memberships into amounts owed. The only place a charge is decided.
 */
@Component
public class PaymentCalculator {

	/**
	 * Recomputes the breakdown for each payment, in place.
	 *
	 * @param payments            the rows to recompute
	 * @param billableMemberships the memberships this list charges for - the month's memberships narrowed to the groups that belong on this sheet
	 * @param monthMemberships    every membership active in the month for these people, whichever sheet it is billed on, which is what the two discounts are worked out from
	 */
	public void recalculate(Collection<Payment> payments, Collection<Membership> billableMemberships, Collection<Membership> monthMemberships, DiscountRules rules) {

		Map<UUID, List<Membership>> billableByPerson = groupByPerson(billableMemberships);
		Map<UUID, List<Membership>> monthByPerson = groupByPerson(monthMemberships);
		Map<UUID, List<PaymentLine>> chargesByPerson = new HashMap<>();

		for (Payment payment : payments) {
			UUID personId = payment.getPerson().getId();
			List<Membership> personMemberships = billableByPerson.getOrDefault(personId, List.of());

			chargesByPerson.put(personId, refreshMembershipLines(payment, personMemberships));
		}

		Map<UUID, Integer> familyPositions = resolveFamilyPositions(payments, monthByPerson);

		for (Payment payment : payments) {
			UUID personId = payment.getPerson().getId();

			// How many groups they attend in total, not how many this sheet happens to charge for.
			int groupCount = monthByPerson.getOrDefault(personId, List.of()).size();
			BigDecimal percent = rules.combinedPercent(familyPositions.getOrDefault(personId, 1), groupCount);

			for (PaymentLine line : chargesByPerson.get(personId)) {
				line.applyDiscount(percent);
			}

			payment.recalculateAmountToPay();
		}
	}

	/**
	 * Brings each membership-derived line up to date, leaving hand-added charges untouched.
	 */
	private List<PaymentLine> refreshMembershipLines(Payment payment, List<Membership> memberships) {
		Map<UUID, PaymentLine> existing = membershipLinesByMembership(payment);
		Set<UUID> stillBilled = new HashSet<>();
		List<PaymentLine> charges = new ArrayList<>();

		for (Membership membership : sortedForStableOutput(memberships)) {
			Group group = membership.getGroup();
			boolean perClass = group.isPerClass();
			PaymentLine line = existing.get(membership.getId());

			if (line == null) {
				line = PaymentLine.builder()
						.membership(membership)
						.quantity(perClass ? Money.ZERO : BigDecimal.ONE)
						.build();

				payment.addLine(line);
			} else if (!perClass) {
				line.setQuantity(BigDecimal.ONE);
			}

			line.setKind(perClass ? PaymentLineKind.MEMBERSHIP_PER_CLASS : PaymentLineKind.MEMBERSHIP_MONTHLY);
			line.setGroup(group);
			line.setDescription(group.getName());
			line.setUnitCost(Money.normalize(membership.resolveUnitCost()));

			stillBilled.add(membership.getId());
			charges.add(line);
		}

		// Whatever is left over belonged to a membership that no longer covers this month, or to a group that has since moved to the other sheet.
		payment.getLines().removeIf(line -> line.getKind().isMembershipDerived()
				&& (line.getMembership() == null || !stillBilled.contains(line.getMembership().getId())));

		return charges;
	}

	private Map<UUID, PaymentLine> membershipLinesByMembership(Payment payment) {
		Map<UUID, PaymentLine> byMembership = new HashMap<>();

		for (PaymentLine line : payment.getLines()) {
			if (line.getKind().isMembershipDerived() && line.getMembership() != null) {
				byMembership.put(line.getMembership().getId(), line);
			}
		}

		return byMembership;
	}

	/**
	 * Works out where each person sits in their household's discount ladder.
	 */
	private Map<UUID, Integer> resolveFamilyPositions(Collection<Payment> payments, Map<UUID, List<Membership>> monthByPerson) {
		Map<UUID, List<Person>> byFamily = new HashMap<>();
		Map<UUID, Integer> positions = new HashMap<>();

		for (Person person : orderedForPositioning(payments, monthByPerson)) {
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
	 * Everybody the month's discount ladders have to account for, each appearing once.
	 */
	private static Collection<Person> orderedForPositioning(Collection<Payment> payments, Map<UUID, List<Membership>> monthByPerson) {
		Map<UUID, Person> candidates = new LinkedHashMap<>();

		for (Payment payment : payments) {
			candidates.putIfAbsent(payment.getPerson().getId(), payment.getPerson());
		}

		for (List<Membership> memberships : monthByPerson.values()) {
			Person person = memberships.getFirst().getPerson();

			if (person.isActive()) {
				candidates.putIfAbsent(person.getId(), person);
			}
		}

		return candidates.values();
	}

	/**
	 * Highest recurring charge first, then the longest-standing member.
	 */
	private Comparator<Person> byDiscountPriority(Map<UUID, List<Membership>> monthByPerson) {
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

	/**
	 * Fixes the order lines are created in, so two runs produce identical output rather than output that merely adds up the same.
	 */
	private static List<Membership> sortedForStableOutput(List<Membership> memberships) {
		return memberships.stream()
				.sorted(Comparator.comparing((Membership membership) -> membership.getGroup().getName(), String.CASE_INSENSITIVE_ORDER)
						.thenComparing(membership -> String.valueOf(membership.getId())))
				.toList();
	}

	private static Map<UUID, List<Membership>> groupByPerson(Collection<Membership> memberships) {
		Map<UUID, List<Membership>> byPerson = new HashMap<>();

		for (Membership membership : memberships) {
			byPerson.computeIfAbsent(membership.getPerson().getId(), key -> new ArrayList<>()).add(membership);
		}

		return byPerson;
	}
}
