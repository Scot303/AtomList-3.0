import { useMatch } from 'react-router';

import { paths } from '@/routes/paths';


/** Which of a list's two screens is open. */
export type PaymentListRouteView = 'payments' | 'transactions';


export interface PaymentListRoute {
	listId: string;
	view: PaymentListRouteView;
}


/**
 * The one of the two payment screens that is currently showing for a payment list or null anywhere else in the application.
 */
export function usePaymentListRoute(): PaymentListRoute | null {
	const payments = useMatch(paths.paymentListDetail);
	const transactions = useMatch(paths.paymentListTransactions);

	const match = payments ?? transactions;

	if (match === null) {
		return null;
	}

	return {
		listId: match.params.listId ?? '',
		view: payments === null ? 'transactions' : 'payments',
	};
}
