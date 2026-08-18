import type { DepositScope, DepositView } from '@/modules/deposits/types/types.ts';
import type { ListType, PaymentListView } from './types.ts';


/**
 * Mirror of the backend's `ListType.scope()`.
 */
const LIST_SCOPES: Record<ListType, DepositScope> = {
	STANDARD: 'OPEN',
	CUSTOM: 'OPEN',
	STANDARD_TOURNAMENT: 'TOURNAMENT',
	CAMP: 'TOURNAMENT',
};


export function scopeOfList(type: ListType): DepositScope {
	return LIST_SCOPES[type];
}


/**
 * Whether a deposit's money is allowed to settle a charge on this list.
 */
export function maySettleOnList(deposit: DepositView, list: PaymentListView): boolean {
	return deposit.scope === scopeOfList(list.type);
}
