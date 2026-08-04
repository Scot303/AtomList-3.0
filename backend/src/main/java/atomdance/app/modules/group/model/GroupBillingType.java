package atomdance.app.modules.group.model;

public enum GroupBillingType {

	/**
	 * A flat fee for the month, regardless of how many classes were attended.
	 */
	MONTHLY,

	/**
	 * Charged per class attended. The per-class price is known and stable, but the count is not known until the month is over, so a manager fills it in on the list.
	 */
	PER_CLASS
}
