import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPersons } from '../api/personsApi';
import { personKeys } from '../api/personKeys';


export function personsQuery() {
	return {
		queryKey: personKeys.list(),
		queryFn: fetchPersons,
	};
}


export function usePersons() {
	return useQuery(personsQuery());
}


export function usePrefetchPersons() {
	const queryClient = useQueryClient();

	return () => {
		void queryClient.prefetchQuery({ ...personsQuery(), meta: { silent: true } });
	};
}
