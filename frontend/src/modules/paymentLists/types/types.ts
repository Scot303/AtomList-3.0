import type { PlannedSettlementView } from '@/modules/deposits/types/types.ts';
import type { PaymentMethod } from '@/types/finance.ts';


/** Mirror of the backend's `ListType`. */
export type ListType = 'STANDARD' | 'STANDARD_TOURNAMENT' | 'CUSTOM' | 'CAMP';

/** Mirror of the backend's `ListStatus`. */
export type ListStatus = 'OPEN' | 'CLOSED';

/** Mirror of the backend's `ListPopulationMode`. */
export type ListPopulationMode = 'BY_GROUPS' | 'BY_PERSONS';

/**
 * Mirror of the backend's `PaymentChargeKind` - what a payment is charging for.
 *
 * `ONE_TIME` is the only kind a user may edit or delete: the other two come from a membership and would be rewritten by the next recalculation.
 */
export type PaymentChargeKind = 'MEMBERSHIP_MONTHLY' | 'MEMBERSHIP_PER_CLASS' | 'ONE_TIME';


/* ── Lists ───────────────────────────────────────────────────────────────── */

/**
 * Mirror of the backend's `PaymentListView`.
 */
export interface PaymentListView {
	id: string;
	type: ListType;
	month: number | null;
	year: number | null;
	name: string | null;
	status: ListStatus;
	closed: boolean;
	closedAt: string | null;
	closedByUserId: string | null;
	isTournamentList: boolean;
	tracksContracts: boolean;
	/**
	 * Whether every charge here names a group.
	 *
	 * True on the monthly sheets, which bill groups and nothing else - anything they do not cover is a `Transaction`.
	 * False on the ad-hoc ones, whose charges are described by hand because there is no group behind them.
	 */
	requiresGroup: boolean;
	populationMode: ListPopulationMode | null;
	note: string | null;
	createdAt: string;
}


/**
 * Mirror of the backend's `ListSummaryView`.
 */
export interface ListSummaryView {
	id: string;
	closed: boolean;
	settledCount: number;
	totalCount: number;
}


/**
 * Mirror of the backend's `MonthSummaryView`.
 *
 * A null list is one that does not exist yet. A null money figure is one this user may not read.
 */
export interface MonthSummaryView {
	year: number;
	month: number;
	tournament: ListSummaryView | null;
	open: ListSummaryView | null;
	billedTotal: number;
	collectedTotal: number;
	clearedElsewhereTotal: number;
	outstandingTotal: number;
	expenseTotal: number | null;
	incomeTotal: number | null;
}


/* ── Payments ────────────────────────────────────────────────────────────── */

/**
 * Mirror of the backend's `PaymentView` - one billable item: what a person owes for one group.
 */
export interface PaymentView {
	id: string;
	number: number | null;
	/** The number rendered as `P-1234`. */
	code: string;
	listId: string;
	personId: string;
	personName: string;
	personFirstName: string;
	personLastName: string;
	chargeKind: PaymentChargeKind;
	/** The group billed. Always set on a monthly list, and null on an ad-hoc one, which bills no groups. */
	groupId: string | null;
	/** The group's name, or what somebody typed on a charge that names no group. */
	description: string | null;
	/** A monthly fee, or the price of one class. Snapshotted, so a later price change does not rewrite history. */
	unitCost: number;
	/** 1 for a monthly fee; for a per-class group, the number of classes attended. */
	quantity: number;
	/** The charge before any discount. */
	gross: number;
	discountPercent: number;
	discountAmount: number;
	amountToPay: number;
	amountSettled: number;
	outstanding: number;
	settled: boolean;
	/** Camp lists only. */
	contractReturned: boolean;
	note: string | null;
	settlements: SettlementView[] | null;
}


/**
 * Mirror of the backend's `SettlementView`
 *
 * `carryingMoney` false makes it a clearance: the debt is settled so nobody chases it, but the cash is counted in the month its deposit arrived in instead.
 */
export interface SettlementView {
	id: string;
	/** The settlement's half of `P-1234/5678`. */
	code: string;
	paymentId: string;
	depositId: string;
	depositCode: string;
	amount: number;
	paymentMethod: PaymentMethod | null;
	settledAt: string;
	carryingMoney: boolean;
	depositReceivedAt: string | null;
}


/* ── Leftover credit, swept onto one list ────────────────────────────────── */

/**
 * Mirror of the backend's `CreditSweepView` - every bit of leftover credit that could be spent on one list, and what each bit would settle there.
 */
export interface CreditSweepView {
	listId: string;
	creditAvailableTotal: number;
	allocatedTotal: number;
	remainingCreditTotal: number;
	depositCount: number;
	/** How many charges would be settled, counted once each however many deposits reach them. */
	paymentCount: number;
	entries: CreditSweepEntryView[];
}


/**
 * Mirror of `CreditSweepView.Entry`
 */
export interface CreditSweepEntryView {
	depositId: string;
	depositCode: string;
	payerId: string;
	payerName: string;
	paymentMethod: PaymentMethod;
	receivedAt: string;
	creditAvailable: number;
	allocated: number;
	remainingCredit: number;
	settlements: PlannedSettlementView[];
}


/**
 * Mirror of the backend's `CreditSweepResultView` - what a sweep actually did, for the message shown after the plan has left the screen.
 */
export interface CreditSweepResultView {
	depositCount: number;
	paymentCount: number;
	allocatedTotal: number;
	remainingCreditTotal: number;
}


/* ── Requests ────────────────────────────────────────────────────────────── */

/**
 * Mirror of the backend's `UpdatePaymentRequest`.
 *
 * `contractReturned` is rejected on any list that does not track contracts.
 */
export interface UpdatePaymentPayload {
	contractReturned?: boolean;
	note?: string;
}


/** Mirror of the backend's `UpdateQuantityRequest`. Refused on a flat monthly fee, which is charged once. */
export interface UpdateQuantityPayload {
	quantity: number;
}


/**
 * Mirror of the backend's `SaveOneOffPaymentRequest`.
 */
export interface SaveOneOffPaymentPayload {
	personId?: string;
	groupId?: string;
	description?: string;
	unitCost: number;
	quantity?: number;
}


/**
 * Mirror of the backend's `AddPersonsRequest` - people to put on a list, each with one charge to fill in afterwards.
 */
export interface AddPersonsPayload {
	personIds: string[];
	/** Required on a list that bills groups, refused on one that does not. */
	groupId?: string;
}


/**
 * Mirror of the backend's `SettleDirectRequest` - money handed over for one charge and nothing else.
 */
export interface SettleDirectPayload {
	amount: number;
	paymentMethod: PaymentMethod;
	receivedAt?: string;
	note?: string;
}


/**
 * Mirror of the backend's `SettleCreditRequest` - spends leftover credit on one list.
 */
export interface SettleCreditPayload {
	expected?: SettleCreditEntryPayload[];
}


export interface SettleCreditEntryPayload {
	depositId: string;
	paymentId: string;
	amount: number;
}


/* ── Report ──────────────────────────────────────────────────────────────── */

/**
 * Mirror of the backend's `ListReportView` - everything one printed list says.
 */
export interface ListReportView {
	listId: string;
	type: ListType;
	status: ListStatus;
	closed: boolean;
	year: number | null;
	month: number | null;
	name: string | null;
	/** A short human-readable name for the sheet: its month, or the name somebody gave it. */
	label: string;
	tracksContracts: boolean;
	generatedAt: string;
	cashIn: ReportDepositView[];
	totals: ReportTotalsView;
}


/**
 * Mirror of `ListReportView.Deposit` - one deposit of money belonging to this period, and what became of it.
 */
export interface ReportDepositView {
	depositId: string;
	depositCode: string;
	/** The deposit's number within this report - "#1", "#2" - so paper references stay short. */
	ref: number;
	payerId: string;
	payerName: string;
	paymentMethod: PaymentMethod;
	receivedAt: string;
	direct: boolean;
	totalAmount: number;
	countedOnThisList: number;
	spentElsewhere: number;
	unallocated: number;
	overpaid: boolean;
	note: string | null;
	label: string;
	creditLabel: string | null;
}


/**
 * Mirror of `ListReportView.Totals`.
 */
export interface ReportTotalsView {
	rowCount: number;
	settledCount: number;
	billedTotal: number;
	collectedTotal: number;
	clearedElsewhereTotal: number;
	outstandingTotal: number;
	depositsReceivedTotal: number;
	depositsCountedHereTotal: number;
	depositsSpentElsewhereTotal: number;
	depositsUnallocatedTotal: number;
	reconciles: boolean;
}
