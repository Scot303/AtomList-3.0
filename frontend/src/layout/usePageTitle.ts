import { useLocation } from 'react-router';

import { usePaymentList } from '@/modules/paymentLists/hooks/queries/usePaymentLists.ts';
import { describeList } from '@/modules/paymentLists/types/listLabels';
import { MODULES } from '@/modules/registry';
import { usePaymentListRoute } from './usePaymentListRoute.ts';


export interface PageTitle {
	text: string;
	closed: boolean;
}


/**
 * What the top bar calls the current screen.
 */
export function usePageTitle(): PageTitle {
	const location = useLocation();
	const listRoute = usePaymentListRoute();

	const paymentList = usePaymentList(listRoute?.listId ?? '');

	if (paymentList.data !== undefined) {
		return { text: describeList(paymentList.data), closed: paymentList.data.closed };
	}

	const moduleLabel = MODULES.find((module) => location.pathname.startsWith(module.path))?.label;

	return { text: moduleLabel ?? 'AtomList', closed: false };
}
