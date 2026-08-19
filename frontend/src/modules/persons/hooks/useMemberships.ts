import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMemberships } from '../api/membershipsApi';
import { personKeys } from '../api/personKeys';


function membershipsQuery(personId: string) {
	return {
		queryKey: personKeys.memberships(personId),
		queryFn: () => fetchMemberships(personId),
	};
}


export function useMemberships(personId: string) {
	return useQuery(membershipsQuery(personId));
}


export function usePrefetchMemberships() {
	const queryClient = useQueryClient();

	return (personId: string) => {
		void queryClient.prefetchQuery({ ...membershipsQuery(personId), meta: { silent: true } });
	};
}
