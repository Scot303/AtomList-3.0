import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openStandardList } from '../api/paymentListsApi';
import { paymentListKeys } from '../api/paymentListKeys';
import { seasonStartOf } from '../types/seasons';


export interface OpenStandardListVariables {
	year: number;
	month: number;
	tournament: boolean;
}


/**
 * Opens a month's standard list, creating it if this is the first time anybody has asked for it.
 *
 * A mutation rather than a query even though the endpoint is a GET: it writes, and a query would re-run it whenever
 * the component remounted or the connection came back, creating lists nobody asked for.
 */
export function useOpenStandardList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ year, month, tournament }: OpenStandardListVariables) => openStandardList(year, month, tournament),

		onSuccess: (_list, { year, month }) => void queryClient.invalidateQueries({ queryKey: paymentListKeys.seasonSummary(seasonStartOf(year, month)) }),
	});
}
