import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { fetchCustomLists, fetchPaymentList } from '../../api/paymentListsApi.ts';
import { paymentListKeys } from '../../api/paymentListKeys.ts';
import { paymentsQuery } from './usePayments.ts';


/* ------------------ STANDARD LISTS ------------------ */

export function paymentListQuery(id: string) {
	return {
		queryKey: paymentListKeys.byId(id),
		queryFn: () => fetchPaymentList(id),
	};
}


export function usePaymentList(id: string) {
	const { hasPermission } = useAuth();

	return useQuery({
		...paymentListQuery(id),
		enabled: id !== '' && hasPermission('READ_LISTS'),
		meta: { silent: true },
	});
}


export function usePrefetchList() {
	const queryClient = useQueryClient();
	const { hasPermission } = useAuth();

	return (listId: string) => {
		void queryClient.prefetchQuery({ ...paymentListQuery(listId), meta: { silent: true } });

		if (hasPermission('READ_PAYMENTS')) {
			void queryClient.prefetchQuery({ ...paymentsQuery(listId), meta: { silent: true } });
		}
	};
}


/* ------------------ CUSTOM LISTS ------------------ */

export function customListsQuery() {
	return {
		queryKey: paymentListKeys.custom(),
		queryFn: fetchCustomLists,
	};
}


export function useCustomLists() {
	const { hasPermission } = useAuth();

	return useQuery({
		...customListsQuery(),
		enabled: hasPermission('READ_LISTS'),
	});
}