package atomdance.app.modules.finance.payment.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.discount.service.ChargedMemberships;
import atomdance.app.modules.discount.service.DiscountRules;
import atomdance.app.modules.discount.service.FamilyPositions;
import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.model.PaymentChargeKind;
import atomdance.app.modules.finance.paymentList.model.PaymentList;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.person.model.Person;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.*;


/**
 * Turns memberships into amounts owed. The only place a charge is decided.
 * <p>
 * One payment per person per group: a membership that belongs on this sheet gets a row, and nothing else does.
 */
@Component
public class PaymentCalculator {

	/**
	 * What a recalculation concluded.
	 *
	 * @param current  every payment that should exist on the list afterwards, amounts already applied
	 * @param created  the subset of {@code current} that is new and needs saving
	 * @param obsolete payments whose group is no longer billed and which hold nothing worth keeping
	 */
	public record Recalculation(List<Payment> current, List<Payment> created, List<Payment> obsolete) {
	}


	/**
	 * Recomputes a whole list.
	 *
	 * @param existing            the payments already on the list
	 * @param billableMemberships the memberships this list charges for - the month's memberships narrowed to the groups that belong on this sheet
	 * @param monthMemberships    every membership active in the month for these people, whichever sheet it is billed on, which is what the two discounts are worked out from
	 */
	public Recalculation recalculate(PaymentList list, Collection<Payment> existing, Collection<Membership> billableMemberships, Collection<Membership> monthMemberships, DiscountRules rules) {

		YearMonth month = list.yearMonth();

		// Memberships billed on this specific sheet
		Map<UUID, List<Membership>> billableByPerson = FamilyPositions.byPerson(billableMemberships);
		// All memberships active that month, including ones billed on another sheet
		Map<UUID, List<Membership>> monthByPerson = FamilyPositions.byPerson(monthMemberships);

		List<Payment> oneOffs = new ArrayList<>();
		// Membership-derived payments, indexed by personId -> groupId -> payment
		Map<UUID, Map<UUID, Payment>> membershipDerived = indexByPersonAndGroup(existing, oneOffs);

		List<Payment> current = new ArrayList<>(oneOffs);
		List<Payment> created = new ArrayList<>();

		Map<UUID, Person> persons = personsOf(existing, billableMemberships);

		// For every person who has billable memberships, process one membership per group.
		for (Map.Entry<UUID, List<Membership>> entry : billableByPerson.entrySet()) {
			Map<UUID, Payment> byGroup = membershipDerived.getOrDefault(entry.getKey(), Map.of());

			for (Membership membership : ChargedMemberships.oneMembershipPerGroup(entry.getValue())) {
				// For each person/group pair, try to reuse an existing payment
				Payment payment = byGroup.get(membership.getGroup().getId());

				if (payment == null) {
					payment = newPayment(list, membership.getPerson(), membership);
					created.add(payment);
				}

				// Updates membership-derived information
				refresh(payment, membership, month);

				// Every resulting membership-derived payment is added to current, alongside the manual charges preserved earlier
				current.add(payment);
			}
		}

		// Applies discounts to every payment in current.
		// For each person, the discount is calculated once and reused across all their group payments:
		applyDiscounts(current, monthByPerson, persons, rules, month);

		// current: payments that belong in the recalculated result
		// created: new payments the service must save
		// obsolete: former membership-derived payments no longer represented by a billable membership and with no money settled against them
		return new Recalculation(current, created, obsoleteAmong(existing, current));
	}


	/**
	 * Applies the month's two discount ladders and the person's flat student rate. A one-off charge is left alone - it is a figure somebody typed, not a fee a rule applies to.
	 * <p>
	 * Neither ladder counts a group somebody pays nothing for, so a free membership neither deepens their own discount nor moves a sibling down the household ladder.
	 */
	private void applyDiscounts(Collection<Payment> payments, Map<UUID, List<Membership>> monthByPerson, Map<UUID, Person> persons, DiscountRules rules, YearMonth month) {
		Map<UUID, Integer> familyPositions = FamilyPositions.resolve(orderedForPositioning(payments, persons, monthByPerson), monthByPerson, month);
		Map<UUID, BigDecimal> percentByPerson = new HashMap<>();

		for (Payment payment : payments) {
			Person person = payment.getPerson();

			BigDecimal percent = percentByPerson.computeIfAbsent(person.getId(), key -> rules.combinedPercent(
					familyPositions.getOrDefault(key, 1),
					ChargedMemberships.groupCount(monthByPerson.get(key), month),
					person.isStudentDiscount()));

			payment.applyDiscount(payment.getChargeKind().isMembershipDerived() ? percent : Money.ZERO);
		}
	}


	/**
	 * Brings a payment up to date with the membership it bills, preserving what a manager entered by hand.
	 *
	 * @param month the month being billed, which decides whether this is the joiner's part-month rate or their standing one
	 */
	private static void refresh(Payment payment, Membership membership, YearMonth month) {
		Group group = membership.getGroup();
		boolean perClass = group.isPerClass();

		payment.setChargeKind(PaymentChargeKind.forGroup(perClass));
		payment.setMembership(membership);
		payment.setGroup(group);
		payment.setDescription(group.getName());
		payment.setUnitCost(Money.normalize(membership.resolveUnitCostFor(month)));

		// A per-class count is attendance a manager recorded, so a recalculation must leave it be.
		if (!perClass) {
			payment.setQuantity(BigDecimal.ONE);
		}
	}


	private static Payment newPayment(PaymentList list, Person person, Membership membership) {
		return Payment.builder()
				.list(list)
				.person(person)
				.chargeKind(PaymentChargeKind.forGroup(membership.getGroup().isPerClass()))
				.quantity(membership.getGroup().isPerClass() ? Money.ZERO : BigDecimal.ONE)
				.build();
	}


	/**
	 * Splits what is already on the list into the membership-derived rows, keyed by person and group, and the
	 * hand-added ones - which no membership can claim and no recalculation may touch.
	 */
	private static Map<UUID, Map<UUID, Payment>> indexByPersonAndGroup(Collection<Payment> existing, List<Payment> oneOffs) {
		Map<UUID, Map<UUID, Payment>> byPersonAndGroup = new HashMap<>();

		for (Payment payment : existing) {
			if (payment.getChargeKind() == null || !payment.getChargeKind().isMembershipDerived() || payment.getGroup() == null) {
				oneOffs.add(payment);

				continue;
			}

			byPersonAndGroup
					.computeIfAbsent(payment.getPerson().getId(), key -> new HashMap<>())
					.put(payment.getGroup().getId(), payment);
		}

		return byPersonAndGroup;
	}


	/**
	 * Whatever is left over belonged to a group that is no longer billed here - the membership ended, or the
	 * group moved to the other sheet. Only droppable while nothing has been paid towards it.
	 */
	private static List<Payment> obsoleteAmong(Collection<Payment> existing, Collection<Payment> current) {
		Set<Payment> kept = Collections.newSetFromMap(new IdentityHashMap<>());
		kept.addAll(current);

		return existing.stream()
				.filter(payment -> !kept.contains(payment))
				.filter(payment -> !payment.holdsSettlements())
				.toList();
	}


	private static Map<UUID, Person> personsOf(Collection<Payment> payments, Collection<Membership> memberships) {
		Map<UUID, Person> persons = new LinkedHashMap<>();

		for (Payment payment : payments) {
			persons.putIfAbsent(payment.getPerson().getId(), payment.getPerson());
		}

		for (Membership membership : memberships) {
			persons.putIfAbsent(membership.getPerson().getId(), membership.getPerson());
		}

		return persons;
	}


	/**
	 * Everybody the month's discount ladders have to account for, each appearing once.
	 */
	private static Collection<Person> orderedForPositioning(Collection<Payment> payments, Map<UUID, Person> known, Map<UUID, List<Membership>> monthByPerson) {
		Map<UUID, Person> candidates = new LinkedHashMap<>();

		for (Payment payment : payments) {
			candidates.putIfAbsent(payment.getPerson().getId(), payment.getPerson());
		}

		candidates.putAll(known);

		// Siblings billed on the other sheet still take up a rung on the family ladder.
		for (List<Membership> memberships : monthByPerson.values()) {
			Person person = memberships.getFirst().getPerson();

			if (person.isActive()) {
				candidates.putIfAbsent(person.getId(), person);
			}
		}

		return candidates.values();
	}
}
