import type { CoveredPersonView, PaymentMethod } from '@/types/finance.ts';


/** Mirror of the backend's `DepositOrigin`. */
export type DepositOrigin = 'COUNTER' | 'DIRECT';

/** Mirror of the backend's `DepositScope` - which account the money was paid into. */
export type DepositScope = 'OPEN' | 'TOURNAMENT';


/* ── Deposits ────────────────────────────────────────────────────────────── */

/**
 * Mirror of the backend's `DepositView`
 */
export interface DepositView {
	id: string;
	number: number | null;
	/** The number rendered as `W-1234`. */
	code: string;
	coveredPersons: CoveredPersonView[];
	totalAmount: number;
	allocatedAmount: number;
	/** What of it is still credit in the covered persons' names. */
	unallocatedAmount: number;
	paymentMethod: PaymentMethod;
	/** ISO-8601 timestamp. The month this falls in is the one that reports the cash as income. */
	receivedAt: string;
	/** The account it was paid into, and so the only charges it may settle. */
	scope: DepositScope;
	origin: DepositOrigin;
	note: string | null;
	/** ISO-8601 timestamp. */
	createdAt: string;
	settlements: DepositSettlementView[] | null;
}


/**
 * Mirror of the backend's `DepositSettlementView` - what one deposit settled, seen from the money's side.
 */
export interface DepositSettlementView {
	id: string;
	code: string;
	amount: number;
	/** ISO-8601 timestamp. */
	settledAt: string;
	carryingMoney: boolean;
	paymentId: string;
	paymentCode: string;
	listId: string;
	year: number | null;
	month: number | null;
	tournamentList: boolean;
	listName: string | null;
	personId: string;
	personName: string;
	/** The billed group, or null for an ad-hoc charge. */
	groupId: string | null;
	description: string | null;
}


/**
 * Mirror of the backend's `DepositPlanView` - what a sum of money would settle, before anything is written.
 */
export interface DepositPlanView {
	totalAmount: number;
	allocatedAmount: number;
	unallocatedAmount: number;
	coversEverythingOwed: boolean;
	nextMonthNotBilled: boolean;
	settlements: PlannedSettlementView[];
}


/**
 * Mirror of the backend's `PlannedSettlementView`.
 */
export interface PlannedSettlementView {
	paymentId: string;
	paymentCode: string;
	listId: string;
	year: number | null;
	month: number | null;
	tournamentList: boolean;
	listClosed: boolean;
	personId: string;
	personName: string;
	/** The billed group, or null for an ad-hoc charge. */
	groupId: string | null;
	description: string | null;
	amountToPay: number;
	alreadySettled: number;
	amount: number;
	/** What would still be owed on the charge once this is applied. */
	remainingAfter: number;
	/** Whether the charge is left still owing afterwards. */
	partial: boolean;
}


/* ── Requests ────────────────────────────────────────────────────────────── */

/**
 * Mirror of the backend's `PlanDepositRequest`.
 */
export interface PlanDepositPayload {
	amount: number;
	personIds: string[];
	/** Which account this money was paid into. Required - the two are kept apart. */
	scope: DepositScope;
	/** ISO-8601 timestamp. The month it falls in is what "arrears" and "ahead" are measured against. */
	receivedAt?: string;
	monthsAhead?: number;
}


/**
 * Mirror of the backend's `CreateDepositRequest`.
 */
export interface CreateDepositPayload extends PlanDepositPayload {
	paymentMethod: PaymentMethod;
	expected?: ExpectedSettlementPayload[];
	note?: string;
}


/** One line of the plan the user approved. */
export interface ExpectedSettlementPayload {
	paymentId: string;
	amount: number;
}


/**
 * Mirror of the backend's `AllocateDepositRequest` - spends what is left of a deposit.
 *
 * With no `targets`, the credit goes where a fresh plan would put it: arrears first.
 */
export interface AllocateDepositPayload {
	personIds?: string[];
	monthsAhead?: number;
	targets?: AllocateTargetPayload[];
	/** The plan the user approved, echoed back. Only read when planning; the server settles nothing else. */
	expected?: ExpectedSettlementPayload[];
}


export interface AllocateTargetPayload {
	paymentId: string;
	/** How much of the credit to put against it, or omitted for as much as it owes. */
	amount?: number;
}
