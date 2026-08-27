import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { fetchPersonCredit } from '../../api/depositsApi.ts';
import { depositKeys } from '../../api/depositKeys.ts';


export function personCreditQuery(personId: string) {
	return {
		queryKey: depositKeys.credit(personId),
		queryFn: () => fetchPersonCredit(personId),
	};
}


export function usePersonCredit(personId: string, enabled = true) {
	const { hasPermission } = useAuth();

	return useQuery({
		...personCreditQuery(personId),
		enabled: enabled && personId !== '' && hasPermission('READ_PAYMENTS'),
	});
}


export function usePrefetchPersonCredit() {
	const queryClient = useQueryClient();

	return (personId: string) => {
		void queryClient.prefetchQuery({ ...personCreditQuery(personId), meta: { silent: true } });
	};
}
