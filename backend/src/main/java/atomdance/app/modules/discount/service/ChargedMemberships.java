package atomdance.app.modules.discount.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.group.model.Membership;

import java.time.YearMonth;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;


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
}
