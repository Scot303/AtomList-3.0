package atomdance.app.modules.discount.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.group.model.Membership;

import java.time.YearMonth;
import java.util.*;


/**
 * Decides which memberships the discount ladders are allowed to count.
 * <p>
 * A group somebody pays nothing for is not a group either ladder counts: a free membership must not push its holder up
 * the group-count ladder, and somebody who pays nothing at all must not take up a rung on their household's ladder and
 * push their paying siblings down it.
 */
public final class ChargedMemberships {

	private ChargedMemberships() {
	}


	/**
	 * Whether this membership bills anything at all in the given month.
	 */
	public static boolean isCharged(Membership membership, YearMonth month) {
		return Money.isPositive(Money.normalize(membership.resolveUnitCostFor(month)));
	}


	/**
	 * Whether anything at all is billed for these memberships in the given month.
	 */
	public static boolean anyCharged(List<Membership> memberships, YearMonth month) {
		if (memberships == null) {
			return false;
		}

		return memberships.stream().anyMatch(membership -> isCharged(membership, month));
	}


	/**
	 * How many groups the group-count ladder counts, which is the distinct groups that bill something.
	 * A group is counted once, however many memberships of it are held.
	 */
	public static int groupCount(List<Membership> memberships, YearMonth month) {
		if (memberships == null) {
			return 0;
		}

		Set<UUID> groups = new HashSet<>();

		for (Membership membership : memberships) {
			if (isCharged(membership, month)) {
				groups.add(membership.getGroup().getId());
			}
		}

		return groups.size();
	}


	/**
	 * A person can hold two memberships of one group in a month - having left and rejoined - and that is one group to bill, not two.
	 * The most recent one carries the rate.
	 */
	public static List<Membership> oneMembershipPerGroup(List<Membership> memberships) {
		if (memberships == null) {
			return List.of();
		}

		Map<UUID, Membership> byGroup = new LinkedHashMap<>();

		for (Membership membership : sortedForStableOutput(memberships)) {
			byGroup.merge(membership.getGroup().getId(), membership, ChargedMemberships::mostRecent);
		}

		return List.copyOf(byGroup.values());
	}


	private static Membership mostRecent(Membership left, Membership right) {
		int byJoined = left.getJoinedAt().compareTo(right.getJoinedAt());

		return byJoined >= 0 ? left : right;
	}


	/**
	 * Fixes the order rows are produced in, so two runs give identical output rather than output that merely adds up the same.
	 */
	private static List<Membership> sortedForStableOutput(List<Membership> memberships) {
		return memberships.stream()
				.sorted(Comparator.comparing((Membership membership) -> membership.getGroup().getName(), String.CASE_INSENSITIVE_ORDER)
						.thenComparing(membership -> String.valueOf(membership.getId())))
				.toList();
	}
}
