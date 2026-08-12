import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchGroups } from '../api/groupsApi';
import { groupKeys } from '../api/personKeys';

export function useGroups() {
	const { hasPermission } = useAuth();

	return useQuery({
		queryKey: groupKeys.list(),
		queryFn: fetchGroups,
		enabled: hasPermission('READ_GROUPS'),
	});
}
