import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { fetchListReport } from '../../api/paymentListsApi.ts';
import { paymentListKeys } from '../../api/paymentListKeys.ts';


export function listReportQuery(listId: string) {
	return {
		queryKey: paymentListKeys.report(listId),
		queryFn: () => fetchListReport(listId),
	};
}


export function useListReport(listId: string) {
	const { hasPermission } = useAuth();

	return useQuery({
		...listReportQuery(listId),
		enabled: listId !== '' && hasPermission('READ_LISTS') && hasPermission('READ_PAYMENTS'),
	});
}


export function usePrefetchListReport() {
	const queryClient = useQueryClient();

	return (listId: string) => {
		void queryClient.prefetchQuery({ ...listReportQuery(listId), meta: { silent: true } });
	};
}
