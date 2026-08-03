package atomdance.app.modules.finance.model;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

public enum ListType {

	/**
	 * The monthly billing list for ordinary classes. Named by its month and year, generated from the memberships of groups that are not tournament groups.
	 */
	STANDARD,

	/**
	 * The month's tournament billing list: the same monthly generation, over tournament groups only.
	 */
	STANDARD_TOURNAMENT,

	/**
	 * An ad-hoc list with a name the manager chose and a hand-picked set of people.
	 */
	CUSTOM,

	/**
	 * A custom list for a camp, which additionally tracks whether each attendee returned their contract.
	 */
	CAMP;

	private static final Set<ListType> STANDARD_TYPES = Collections.unmodifiableSet(EnumSet.of(STANDARD, STANDARD_TOURNAMENT));

	public static Set<ListType> standardTypes() {
		return STANDARD_TYPES;
	}

	/**
	 * The monthly list that bills a given kind of group.
	 */
	public static ListType standardFor(boolean tournament) {
		return tournament ? STANDARD_TOURNAMENT : STANDARD;
	}

	public boolean isStandard() {
		return this == STANDARD || this == STANDARD_TOURNAMENT;
	}

	public boolean isTournament() {
		return this == STANDARD_TOURNAMENT;
	}

	public boolean requiresCustomName() {
		return !isStandard();
	}

	public boolean tracksContracts() {
		return this == CAMP;
	}
}
