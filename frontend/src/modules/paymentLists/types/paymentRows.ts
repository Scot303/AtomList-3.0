import type { TagOption } from '@/components/ui/tags';
import type { PaymentChargeKind, PaymentView } from './types.ts';


export const PAID_ID = 'paid';
export const UNPAID_ID = 'unpaid';

export type PaidTag = typeof PAID_ID | typeof UNPAID_ID;

export const PAID_TAG_OPTIONS: TagOption[] = [
	{ id: PAID_ID, name: 'Opłacone', color: 'emerald' },
	{ id: UNPAID_ID, name: 'Nieopłacone', color: 'red' },
];


export function toPaidTag(payment: Pick<PaymentView, 'settled'>): PaidTag {
	return payment.settled ? PAID_ID : UNPAID_ID;
}


/* ── How far along the settling is ───────────────────────────────────────── */

export const SETTLED_ID = 'settled';
export const PARTIAL_ID = 'partial';
export const NONE_ID = 'none';

export type SettleState = typeof SETTLED_ID | typeof PARTIAL_ID | typeof NONE_ID;

export const SETTLE_STATE_OPTIONS: TagOption[] = [
	{ id: SETTLED_ID, name: 'Opłacone', color: 'emerald' },
	{ id: PARTIAL_ID, name: 'Częściowo', color: 'orange' },
	{ id: NONE_ID, name: 'Nieopłacone', color: 'red' },
];


export function toSettleState(payment: Pick<PaymentView, 'outstanding' | 'amountSettled'>): SettleState {
	if (payment.outstanding <= 0) {
		return SETTLED_ID;
	}

	return payment.amountSettled > 0 ? PARTIAL_ID : NONE_ID;
}


/* ── What the charge is for ──────────────────────────────────────────────── */

export const CHARGE_KIND_OPTIONS: TagOption[] = [
	{ id: 'MEMBERSHIP_MONTHLY', name: 'Miesięczna', color: 'indigo' },
	{ id: 'MEMBERSHIP_PER_CLASS', name: 'Za wejście', color: 'amber' },
	{ id: 'ONE_TIME', name: 'Jednorazowa', color: 'violet' },
];


export function isMembershipDerived(chargeKind: PaymentChargeKind): boolean {
	return chargeKind !== 'ONE_TIME';
}


export function hasCountableQuantity(chargeKind: PaymentChargeKind): boolean {
	return chargeKind !== 'MEMBERSHIP_MONTHLY';
}


/* ── Camp contracts ──────────────────────────────────────────────────────── */

export const CONTRACT_RETURNED_ID = 'returned';
export const CONTRACT_PENDING_ID = 'pending';

export type ContractTag = typeof CONTRACT_RETURNED_ID | typeof CONTRACT_PENDING_ID;

export const CONTRACT_TAG_OPTIONS: TagOption[] = [
	{ id: CONTRACT_RETURNED_ID, name: 'Zwrócona', color: 'emerald' },
	{ id: CONTRACT_PENDING_ID, name: 'Brak zwrotu', color: 'slate' },
];


/* ── Row ─────────────────────────────────────────────────────────────────── */

/**
 * One charge as the table reads it.
 */
export interface PaymentRow {
	id: string;
	number: number | null;
	code: string;
	firstName: string;
	lastName: string;
	/** The group's name, or what somebody typed on a charge that names no group. What the column sorts, groups, and searches on. */
	label: string;
	groupId: string | null;
	chargeKind: PaymentChargeKind;
	unitCost: number;
	quantity: number;
	amountToPay: number;
	amountSettled: number;
	outstanding: number;
	settleState: SettleState;
	isPaid: PaidTag;
	contractReturned: ContractTag;
	note: string | null;
	payment: PaymentView;
}


export function chargeLabel(payment: PaymentView): string {
	const described = payment.description ?? '';

	return described.trim();
}


export function toPaymentRow(payment: PaymentView): PaymentRow {
	return {
		id: payment.id,
		number: payment.number,
		code: payment.code,
		firstName: payment.personFirstName,
		lastName: payment.personLastName,
		label: chargeLabel(payment),
		groupId: payment.groupId,
		chargeKind: payment.chargeKind,
		unitCost: payment.unitCost,
		quantity: payment.quantity,
		amountToPay: payment.amountToPay,
		amountSettled: payment.amountSettled,
		outstanding: payment.outstanding,
		settleState: toSettleState(payment),
		isPaid: toPaidTag(payment),
		contractReturned: payment.contractReturned ? CONTRACT_RETURNED_ID : CONTRACT_PENDING_ID,
		note: payment.note,
		payment,
	};
}
