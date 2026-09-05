import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { personKeys } from '../../api/personKeys.ts';
import { fetchPersonDiscounts } from '../../api/personsApi.ts';


function discountsQuery(personId: string, year: number, month: number) {
	return {
		queryKey: personKeys.discount(personId, year, month),
		queryFn: () => fetchPersonDiscounts(personId, year, month),
	};
}


export function usePersonDiscounts(personId: string, year: number, month: number) {
	const { hasPermission } = useAuth();

	return useQuery({
		...discountsQuery(personId, year, month),
		enabled: personId !== '' && hasPermission('READ_PERSONS'),
		placeholderData: keepPreviousData,
	});
}


export function usePrefetchPersonDiscounts() {
	const queryClient = useQueryClient();

	return (personId: string, year: number, month: number) => {
		void queryClient.prefetchQuery({ ...discountsQuery(personId, year, month), meta: { silent: true } });
	};
}
