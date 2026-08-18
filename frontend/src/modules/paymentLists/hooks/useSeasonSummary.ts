import { useCallback } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchSeasonSummary } from '../api/paymentListsApi';
import { paymentListKeys } from '../api/paymentListKeys';


export function seasonSummaryQuery(startYear: number) {
	return {
		queryKey: paymentListKeys.seasonSummary(startYear),
		queryFn: () => fetchSeasonSummary(startYear),
	};
}


/**
 * A season of month cards - September of `startYear` through to the following August, in that order.
 *
 * Holds the previous season's figures while the next one loads, so stepping through seasons does not blank all twelve cards on every press.
 */
export function useSeasonSummary(startYear: number) {
	const { hasPermission } = useAuth();

	return useQuery({
		...seasonSummaryQuery(startYear),
		enabled: hasPermission('READ_LISTS'),
		placeholderData: keepPreviousData,
	});
}


export function usePrefetchSeasonSummary() {
	const queryClient = useQueryClient();

	return useCallback((startYear: number) => {
		void queryClient.prefetchQuery({ ...seasonSummaryQuery(startYear), meta: { silent: true } });
	}, [queryClient]);
}
