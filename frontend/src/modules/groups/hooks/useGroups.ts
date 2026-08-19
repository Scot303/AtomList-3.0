import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchGroups } from '../api/groupsApi';
import { groupKeys } from '../api/groupKeys';


export function groupsQuery() {
	return {
		queryKey: groupKeys.list(),
		queryFn: fetchGroups,
	};
}


export function useGroups() {
	const { hasPermission } = useAuth();

	return useQuery({
		...groupsQuery(),
		enabled: hasPermission('READ_GROUPS'),
	});
}
