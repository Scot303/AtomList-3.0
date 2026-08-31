package atomdance.app.modules.finance.paymentList.dto;

import atomdance.app.modules.finance.deposit.dto.CoveredPersonView;
import atomdance.app.modules.finance.deposit.model.PaymentMethod;
import atomdance.app.modules.finance.payment.model.PaymentChargeKind;
import atomdance.app.modules.finance.paymentList.model.ListStatus;
import atomdance.app.modules.finance.paymentList.model.ListType;

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
	 * @param parts            each payment's settlement, in date order. Empty when nothing has been paid.
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
	 * One settlement of one payment.
	 *
	 * @param depositRef        the deposit's number within this report - "#1", "#2" - so paper references stay short
	 * @param carryingMoney     whether this counts as income here. {@code false} means the debt was cleared out of another period's money,
	 *                          which is reported in the month {@link #depositReceivedAt} falls in instead. Such a part contributes nothing to this sheet's total.
	 * @param depositReceivedAt when that money arrived, which is what decides the month reporting it
	 * @param label             the phrase to print against it, already translated
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
			Instant depositReceivedAt,
			String label
	) {
	}


	/**
	 * One handover of money, and what became of it as seen from this sheet.
	 * <p>
	 * The four amounts partition the total exactly, which is the whole reason a deposit exists: the money is counted once, here or elsewhere, or not yet at all.
	 *
	 * @param belongsHere       whether this sheet is the one that has to account for the handover - the money arrived during its month, or it is an ad-hoc sheet the money landed on directly.
	 *                          Only these deposits feed {@link Totals}; the others are listed so that every paid row can point at the handover it came out of,
	 *                          and counting their money here would book the same cash on two sheets.
	 * @param countedOnThisList what of it is this sheet's income
	 * @param clearedOnThisList what of it settled a charge on this very sheet without being its income, because the cash belongs to another month or the sheet was already closed when it landed
	 * @param spentElsewhere    what of it settled charges on other sheets
	 * @param unallocated       what of it is still credit to be used in the covered persons' names.
	 *                          Negative would mean more was allocated than was ever handed over, which is a bug rather than a state - it is left unclamped so {@link Totals#reconciles} can see it.
	 * @param overpaid          whether any of it went beyond this sheet: arrears, a month ahead, or credit still in hand.
	 * @param creditLabel       the phrase for money not yet assigned to anything, or {@code null} when there is none.
	 */
	public record Deposit(
			UUID depositId,
			String depositCode,
			int ref,
			List<CoveredPersonView> coveredPersons,
			PaymentMethod paymentMethod,
			Instant receivedAt,
			boolean direct,
			boolean belongsHere,
			BigDecimal totalAmount,
			BigDecimal countedOnThisList,
			BigDecimal clearedOnThisList,
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
	 * This is where an overpayment becomes legible. A handover of 1600 that cleared June's arrears and paid September ahead says so here, on the sheet for the month the money arrived in.
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
	 * {@link #outstandingTotal} is <em>not</em> billed minus collected, because that subtraction reports a debt for every arrear somebody has already settled out of a later month.
	 * <p>
	 * The {@code deposits*} figures are the cash box for this sheet's period, so they count only the deposits with {@link Deposit#belongsHere}.
	 * A deposit that merely settled a charge here on its way through belongs to the sheet for the month it arrived in, and is reported there.
	 *
	 * @param depositsReceivedTotal    what was handed over during this sheet's period. The four figures below partition it exactly.
	 * @param depositsClearedHereTotal what of it settled charges on this sheet without being its income
	 * @param reconciles               whether the money summed over the rows and the money summed over the deposits agree.
	 *                                 The two are worked out by walking different tables, so a mismatch is a bug.
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
			BigDecimal depositsClearedHereTotal,
			BigDecimal depositsSpentElsewhereTotal,
			BigDecimal depositsUnallocatedTotal,
			boolean reconciles
	) {
	}
}
