import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { fetchPayment, fetchPayments } from '../../api/paymentsApi.ts';
import { paymentListKeys } from '../../api/paymentListKeys.ts';


/* ------------------ ALL LIST'S PAYMENTS ------------------ */

export function paymentsQuery(listId: string) {
	return {
		queryKey: paymentListKeys.payments(listId),
		queryFn: () => fetchPayments(listId),
	};
}


export function usePayments(listId: string) {
	const { hasPermission } = useAuth();

	return useQuery({
		...paymentsQuery(listId),
		enabled: listId !== '' && hasPermission('READ_PAYMENTS'),
	});
}


export function usePrefetchPayments() {
	const queryClient = useQueryClient();

	return (listId: string) => {
		void queryClient.prefetchQuery({ ...paymentsQuery(listId), meta: { silent: true } });
	};
}


/* ------------------ SINGLE PAYMENT ------------------ */

export function paymentQuery(id: string) {
	return {
		queryKey: paymentListKeys.payment(id),
		queryFn: () => fetchPayment(id),
	};
}


export function usePayment(id: string) {
	const { hasPermission } = useAuth();

	return useQuery({
		...paymentQuery(id),
		enabled: id !== '' && hasPermission('READ_PAYMENTS'),
	});
}


export function usePrefetchPayment() {
	const queryClient = useQueryClient();

	return (id: string) => {
		void queryClient.prefetchQuery({ ...paymentQuery(id), meta: { silent: true } });
	};
}
