import { useLocation, useMatch } from 'react-router';

import { usePaymentList } from '@/modules/paymentLists/hooks/usePaymentLists';
import { describeList } from '@/modules/paymentLists/types/listLabels';
import { MODULES } from '@/modules/registry';
import { paths } from '@/routes/paths';

export interface PageTitle {
	text: string;
	closed: boolean;
}

/**
 * What the top bar calls the current screen.
 */
export function usePageTitle(): PageTitle {
	const location = useLocation();
	const paymentListDetail = useMatch(paths.paymentListDetail);

	const paymentList = usePaymentList(paymentListDetail?.params.listId ?? '');

	if (paymentList.data !== undefined) {
		return { text: describeList(paymentList.data), closed: paymentList.data.closed };
	}

	const moduleLabel = MODULES.find((module) => location.pathname.startsWith(module.path))?.label;

	return { text: moduleLabel ?? 'AtomList', closed: false };
}
