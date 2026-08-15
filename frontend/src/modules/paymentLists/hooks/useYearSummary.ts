import { useCallback } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchYearSummary } from '../api/paymentListsApi';
import { paymentListKeys } from '../api/paymentListKeys';


export function yearSummaryQuery(year: number) {
	return {
		queryKey: paymentListKeys.yearSummary(year),
		queryFn: () => fetchYearSummary(year),
	};
}

/**
 * A year of month cards.
 *
 * Holds the previous year's figures while the next one loads, so stepping through years does not blank all twelve cards on every press.
 */
export function useYearSummary(year: number) {
	const { hasPermission } = useAuth();

	return useQuery({
		...yearSummaryQuery(year),
		enabled: hasPermission('READ_LISTS'),
		placeholderData: keepPreviousData,
	});
}


export function usePrefetchYearSummary() {
	const queryClient = useQueryClient();

	return useCallback((year: number) => {
		void queryClient.prefetchQuery({ ...yearSummaryQuery(year), meta: { silent: true } });
	}, [queryClient]);
}
