import type { TagOption } from '@/components/ui/tags';
import { coveredPersonsNames, type CoveredPersonView, type PaymentMethod } from '@/types/finance.ts';
import type { DepositOrigin, DepositScope, DepositView } from './types.ts';


/** How a deposit's number is written and spoken - the mirror of the backend's `DepositCode.PREFIX`. */
export const DEPOSIT_CODE_PREFIX = 'W-';


/* ── How much of it has been spent ───────────────────────────────────────── */

export const SPENT_ALL_ID = 'all';
export const SPENT_PART_ID = 'part';
export const SPENT_NONE_ID = 'none';

export type AllocationState = typeof SPENT_ALL_ID | typeof SPENT_PART_ID | typeof SPENT_NONE_ID;

export const ALLOCATION_STATE_OPTIONS: TagOption[] = [
	{ id: SPENT_ALL_ID, name: 'Rozliczona', color: 'emerald' },
	{ id: SPENT_PART_ID, name: 'Częściowo', color: 'orange' },
	{ id: SPENT_NONE_ID, name: 'Nierozliczona', color: 'red' },
];


export function toAllocationState(deposit: Pick<DepositView, 'allocatedAmount' | 'unallocatedAmount'>): AllocationState {
	if (deposit.unallocatedAmount <= 0) {
		return SPENT_ALL_ID;
	}

	return deposit.allocatedAmount > 0 ? SPENT_PART_ID : SPENT_NONE_ID;
}


/* ── Which account the money was paid into ───────────────────────────────── */

/**
 * The ids are the backend's own `DepositScope` values, so a row holds what the API returned.
 */
export const SCOPE_OPTIONS: TagOption[] = [
	{ id: 'TOURNAMENT', name: 'KLUBOWE', color: 'violet' },
	{ id: 'OPEN', name: 'OPEN', color: 'blue' },
];


/* ── How it was recorded ─────────────────────────────────────────────────── */

export const ORIGIN_OPTIONS: TagOption[] = [
	{ id: 'COUNTER', name: 'Wpłata ogólna', color: 'cyan' },
	{ id: 'DIRECT', name: 'Do płatności', color: 'slate' },
];


/* ── Row ─────────────────────────────────────────────────────────────────── */

export interface DepositRow {
	id: string;
	number: number | null;
	code: string;
	/** Everybody the money was for. */
	coveredPersons: CoveredPersonView[];
	/** Every covered name in one string. This is what the column sorts, groups and searches on. */
	coveredNames: string;
	totalAmount: number;
	allocatedAmount: number;
	unallocatedAmount: number;
	allocationState: AllocationState;
	paymentMethod: PaymentMethod;
	/** ISO-8601 timestamp, so the date column filters and sorts on the real instant. */
	receivedAt: string;
	/** The account it was paid into. */
	scope: DepositScope;
	origin: DepositOrigin;
	/** How many people the money was said to be for. */
	coveredCount: number;
	note: string | null;
	deposit: DepositView;
}


export function toDepositRow(deposit: DepositView): DepositRow {
	return {
		id: deposit.id,
		number: deposit.number,
		code: deposit.code,
		coveredPersons: deposit.coveredPersons,
		coveredNames: coveredPersonsNames(deposit.coveredPersons),
		totalAmount: deposit.totalAmount,
		allocatedAmount: deposit.allocatedAmount,
		unallocatedAmount: deposit.unallocatedAmount,
		allocationState: toAllocationState(deposit),
		paymentMethod: deposit.paymentMethod,
		receivedAt: deposit.receivedAt,
		scope: deposit.scope,
		origin: deposit.origin,
		coveredCount: deposit.coveredPersons.length,
		note: deposit.note,
		deposit,
	};
}
