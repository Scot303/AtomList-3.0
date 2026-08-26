import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchFamilies } from '../api/familiesApi';
import { familyKeys } from '../api/personKeys';


export function familiesQuery() {
	return {
		queryKey: familyKeys.list(),
		queryFn: fetchFamilies,
	};
}


export function useFamilies() {
	const { hasPermission } = useAuth();

	return useQuery({
		...familiesQuery(),
		enabled: hasPermission('READ_FAMILIES'),
	});
}


export function usePrefetchFamilies() {
	const queryClient = useQueryClient();
	const { hasPermission } = useAuth();

	return () => {
		if (!hasPermission('READ_FAMILIES')) {
			return;
		}

		void queryClient.prefetchQuery({ ...familiesQuery(), meta: { silent: true } });
	};
}
