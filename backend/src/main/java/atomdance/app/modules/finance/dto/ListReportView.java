package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.ListStatus;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentChargeKind;
import atomdance.app.modules.finance.model.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;


/**
 * Everything one printed list says.
 *
 * @param label a short human-readable name for the sheet: its month, or the name a manager gave it
 */
public record ListReportView(
		UUID listId,
		ListType type,
		ListStatus status,
		boolean closed,
		Integer year,
		Integer month,
		String name,
		String label,
		boolean tracksContracts,
		Instant generatedAt,
		List<Row> rows,
		List<Deposit> cashIn,
		Totals totals
) {

	/**
	 * One charge on the sheet, and how it was paid.
	 *
	 * @param parts            each act of settling, in date order. Empty when nothing has been paid; one entry for the ordinary case, which prints as just a method and an amount;
	 *                         several when it was paid in instalments.
	 * @param collectedHere    the part of what was paid that counts as this sheet's income
	 * @param clearedElsewhere the part that was cleared out of another period's money, and is reported there
	 */
	public record Row(
			UUID paymentId,
			String paymentCode,
			UUID personId,
			String personName,
			String personFirstName,
			String personLastName,
			String personPhone,
			PaymentChargeKind chargeKind,
			UUID groupId,
			String description,
			BigDecimal unitCost,
			BigDecimal quantity,
			BigDecimal gross,
			BigDecimal discountPercent,
			BigDecimal discountAmount,
			BigDecimal amountToPay,
			BigDecimal amountSettled,
			BigDecimal outstanding,
			BigDecimal collectedHere,
			BigDecimal clearedElsewhere,
			boolean settled,
			boolean contractReturned,
			String note,
			List<Part> parts
	) {
	}


	/**
	 * One instalment of one charge.
	 *
	 * @param depositRef    the deposit's number within this report - "#1", "#2" - so paper references stay short
	 * @param carryingMoney whether this counts as income here. {@code false} means the debt was cleared out of
	 *                      another period's cash, which is reported in {@link #bookedYear}/{@link #bookedMonth}
	 *                      instead. Such a part contributes nothing to this sheet's total.
	 * @param label         the phrase to print against it, already translated
	 */
	public record Part(
			UUID settlementId,
			String settlementCode,
			BigDecimal amount,
			PaymentMethod paymentMethod,
			Instant settledAt,
			UUID depositId,
			String depositCode,
			int depositRef,
			boolean carryingMoney,
			Integer bookedYear,
			Integer bookedMonth,
			String label
	) {
	}


	/**
	 * One handover of money belonging to this period, and what became of it.
	 * <p>
	 * The three amounts partition the total exactly, which is the whole reason a deposit exists: the money is
	 * counted once, here or elsewhere or not yet at all.
	 *
	 * @param countedOnThisList what of it is this sheet's income
	 * @param spentElsewhere    what of it cleared debts on other sheets - or on this one after it was closed
	 * @param unallocated       what of it is still credit in the payer's name
	 * @param overpaid          whether any of it went beyond this sheet: arrears, a month ahead, or credit still
	 *                          in hand. This is the row a manager is looking for when they ask where an
	 *                          overpayment went, and {@link #allocations} says exactly where.
	 * @param creditLabel       the phrase for money not yet assigned to anything, or {@code null} when there is
	 *                          none. That part has no allocation to hang off, and would otherwise be a number on
	 *                          the sheet with nothing explaining it.
	 */
	public record Deposit(
			UUID depositId,
			String depositCode,
			int ref,
			UUID payerId,
			String payerName,
			PaymentMethod paymentMethod,
			Instant receivedAt,
			Integer bookedYear,
			Integer bookedMonth,
			boolean direct,
			BigDecimal totalAmount,
			BigDecimal countedOnThisList,
			BigDecimal spentElsewhere,
			BigDecimal unallocated,
			boolean overpaid,
			String note,
			String label,
			String creditLabel,
			List<Allocation> allocations
	) {
	}


	/**
	 * One thing a deposit paid for, seen from the money's side.
	 * <p>
	 * This is where an overpayment becomes legible. A handover of 1600 that cleared June's arrears and paid
	 * September ahead says so here, on the sheet for the month the money arrived in - which is the only sheet
	 * that can honestly account for it.
	 *
	 * @param direction where this part of the money went relative to the sheet being printed
	 * @param label     the phrase to print against it, already translated
	 */
	public record Allocation(
			UUID settlementId,
			BigDecimal amount,
			boolean onThisList,
			boolean carryingMoney,
			Direction direction,
			UUID paymentId,
			String paymentCode,
			UUID personId,
			String personName,
			String description,
			UUID listId,
			Integer year,
			Integer month,
			boolean tournamentList,
			String listLabel,
			String label
	) {
	}


	/**
	 * Where a deposit's money went, measured against the sheet being printed.
	 */
	public enum Direction {

		/**
		 * A charge on this very sheet - the ordinary case.
		 */
		THIS_LIST,

		/**
		 * This month, but the other monthly sheet. Only reachable when a deposit predates the rule that keeps
		 * tournament money and class money apart, since one taken now is confined to a single sheet.
		 */
		SAME_MONTH_OTHER_SHEET,

		/**
		 * A debt from an earlier month, cleared out of this month's money.
		 */
		ARREARS,

		/**
		 * A later month, paid ahead out of this month's money.
		 */
		ADVANCE,

		/**
		 * An ad-hoc sheet, which has no month to compare against.
		 */
		OTHER_LIST
	}


	/**
	 * The figures at the bottom of the sheet.
	 * <p>
	 * These three are filtered differently and none is derived from another.
	 * {@link #billedTotal} counts every row - what a month charged is a fact about that month.
	 * {@link #collectedTotal} counts real money only.
	 * {@link #outstandingTotal} is <em>not</em> billed minus collected, because that subtraction reports a debt
	 * for every arrear somebody has already settled out of a later month.
	 *
	 * @param reconciles whether the money summed over the rows and the money summed over the deposits agree.
	 *                   The two are worked out by walking different tables, so a mismatch is a bug in one of
	 *                   them rather than something a manager did - it should never be false.
	 */
	public record Totals(
			long rowCount,
			long settledCount,
			BigDecimal billedTotal,
			BigDecimal collectedTotal,
			BigDecimal clearedElsewhereTotal,
			BigDecimal outstandingTotal,
			BigDecimal depositsReceivedTotal,
			BigDecimal depositsCountedHereTotal,
			BigDecimal depositsSpentElsewhereTotal,
			BigDecimal depositsUnallocatedTotal,
			boolean reconciles
	) {
	}
}
