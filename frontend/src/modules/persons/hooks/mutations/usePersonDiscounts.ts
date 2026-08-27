import { useQuery, useQueryClient } from '@tanstack/react-query';
import { personKeys } from '../../api/personKeys.ts';
import { fetchPersonDiscounts } from '../../api/personsApi.ts';


function discountsQuery(personId: string) {
	return {
		queryKey: personKeys.discount(personId),
		queryFn: () => fetchPersonDiscounts(personId),
	};
}


export function usePersonDiscounts(personId: string) {
	return useQuery(discountsQuery(personId));
}


export function usePrefetchPersonDiscounts() {
	const queryClient = useQueryClient();

	return (personId: string) => {
		void queryClient.prefetchQuery({ ...discountsQuery(personId), meta: { silent: true } });
	};
}
