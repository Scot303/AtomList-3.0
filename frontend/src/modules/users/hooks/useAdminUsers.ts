import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../api/adminUsersApi';
import { adminUserKeys } from '../api/userKeys';

export function useAdminUsers() {
	return useQuery({
		queryKey: adminUserKeys.list(),
		queryFn: fetchUsers,
	});
}
