import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { paymentListKeys } from '@/modules/paymentLists/api/paymentListKeys.ts';
import { fetchPersonArrears } from '../../api/personsApi.ts';


function arrearsQuery(personId: string) {
	return {
		queryKey: paymentListKeys.arrears(personId),
		queryFn: () => fetchPersonArrears(personId),
	};
}


/**
 * What one person still owes. Reads the payment side, but needs only `READ_PERSONS` - see `PaymentController`.
 */
export function usePersonArrears(personId: string) {
	const { hasPermission } = useAuth();

	return useQuery({
		...arrearsQuery(personId),
		enabled: personId !== '' && hasPermission('READ_PERSONS'),
	});
}


export function usePrefetchPersonArrears() {
	const queryClient = useQueryClient();

	return (personId: string) => {
		void queryClient.prefetchQuery({ ...arrearsQuery(personId), meta: { silent: true } });
	};
}
