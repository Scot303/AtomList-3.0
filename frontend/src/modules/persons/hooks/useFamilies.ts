import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchFamilies } from '../api/familiesApi';
import { familyKeys } from '../api/personKeys';

export function useFamilies() {
	const { hasPermission } = useAuth();

	return useQuery({
		queryKey: familyKeys.list(),
		queryFn: fetchFamilies,
		enabled: hasPermission('READ_FAMILIES'),
	});
}
