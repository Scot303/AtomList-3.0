package atomdance.app.modules.finance.deposit.model;

/**
 * How a {@link Deposit} came to be recorded.
 */
public enum DepositOrigin {

	/**
	 * The counter flow: a manager entered a total, picked the people it was for, and confirmed the
	 * computed allocation. One deposit may settle many payments across many months.
	 */
	COUNTER,

	/**
	 * The quick flow: money recorded straight against one payment.
	 */
	DIRECT;


	public boolean isDirect() {
		return this == DIRECT;
	}
}
