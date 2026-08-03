package atomdance.app.modules.finance.model;

/**
 * How a custom list decided who belongs on it.
 */
public enum ListPopulationMode {

	/**
	 * Everybody with an active membership in any of the chosen groups.
	 */
	BY_GROUPS,

	/**
	 * Exactly the people named.
	 */
	BY_PERSONS,

	/**
	 * Everybody still owing money on another list, carrying their outstanding amount over.
	 */
	FROM_UNPAID
}
