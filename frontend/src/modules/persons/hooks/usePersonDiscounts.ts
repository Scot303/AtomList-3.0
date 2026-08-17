import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { personKeys } from '../api/personKeys';
import { fetchPersonDiscounts } from '../api/personsApi';


function discountsQuery(personId: string) {
	return {
		queryKey: personKeys.discount(personId),
		queryFn: () => fetchPersonDiscounts(personId),
	};
}


/**
 * One person's discount for the current month, with everything it was worked out from.
 */
export function usePersonDiscounts(personId: string) {
	return useQuery(discountsQuery(personId));
}


export function usePrefetchPersonDiscounts() {
	const queryClient = useQueryClient();

	return useCallback(
		(personId: string) => {
			void queryClient.prefetchQuery({ ...discountsQuery(personId), meta: { silent: true } });
		},
		[queryClient],
	);
}
