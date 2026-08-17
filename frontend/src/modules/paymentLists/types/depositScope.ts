import type { DepositView } from '@/modules/deposits/types/types.ts';
import type { PaymentListView } from './types.ts';


/**
 * Whether a deposit's money is allowed to settle a charge on this list.
 */
export function maySettleOnList(deposit: DepositView, list: PaymentListView): boolean {
	if (deposit.forTournament === null) {
		return true;
	}

	return list.type === ( deposit.forTournament ? 'STANDARD_TOURNAMENT' : 'STANDARD' );
}
