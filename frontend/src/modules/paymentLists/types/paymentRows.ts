import type { TagOption, TagRecord } from '@/components/ui/tags';
import { tagOptions } from '@/components/ui/tags';
import type { PaymentChargeKind, PaymentView } from './types.ts';


/* ── How far along the settling is ───────────────────────────────────────── */

export const SETTLED_ID = 'settled';
export const PARTIAL_ID = 'partial';
export const NONE_ID = 'none';

export type SettleState = typeof SETTLED_ID | typeof PARTIAL_ID | typeof NONE_ID;

export const SETTLE_STATE_TAGS: TagRecord<SettleState> = {
	[SETTLED_ID]: { id: SETTLED_ID, name: 'Opłacone', color: 'emerald' },
	[PARTIAL_ID]: { id: PARTIAL_ID, name: 'Częściowo', color: 'orange' },
	[NONE_ID]: { id: NONE_ID, name: 'Nieopłacone', color: 'red' },
};

export const SETTLE_STATE_OPTIONS: TagOption[] = tagOptions(SETTLE_STATE_TAGS);


export function toSettleState(payment: Pick<PaymentView, 'outstanding' | 'amountSettled'>): SettleState {
	if (payment.outstanding <= 0) {
		return SETTLED_ID;
	}

	return payment.amountSettled > 0 ? PARTIAL_ID : NONE_ID;
}


/* ── What the charge is for ──────────────────────────────────────────────── */

export const CHARGE_KIND_TAGS: TagRecord<PaymentChargeKind> = {
	MEMBERSHIP_MONTHLY: { id: 'MEMBERSHIP_MONTHLY', name: 'Miesięczna', color: 'indigo' },
	MEMBERSHIP_PER_CLASS: { id: 'MEMBERSHIP_PER_CLASS', name: 'Za wejście', color: 'amber' },
	ONE_TIME: { id: 'ONE_TIME', name: 'Jednorazowa', color: 'violet' },
};

export const CHARGE_KIND_OPTIONS: TagOption[] = tagOptions(CHARGE_KIND_TAGS);


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

export const CONTRACT_TAGS: TagRecord<ContractTag> = {
	[CONTRACT_RETURNED_ID]: { id: CONTRACT_RETURNED_ID, name: 'Zwrócona', color: 'emerald' },
	[CONTRACT_PENDING_ID]: { id: CONTRACT_PENDING_ID, name: 'Brak zwrotu', color: 'slate' },
};

export const CONTRACT_TAG_OPTIONS: TagOption[] = tagOptions(CONTRACT_TAGS);


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
		contractReturned: payment.contractReturned ? CONTRACT_RETURNED_ID : CONTRACT_PENDING_ID,
		note: payment.note,
		payment,
	};
}
