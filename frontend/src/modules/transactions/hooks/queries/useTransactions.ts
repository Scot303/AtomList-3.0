import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { fetchTransactions } from '../../api/transactionsApi.ts';
import { transactionKeys } from '../../api/transactionKeys.ts';
import type { Permission } from '@/types/auth.ts';


/**
 * Either half is enough to open the screen: the backend filters the rows down to the side the caller may read.
 */
export const TRANSACTION_READ_PERMISSIONS: readonly Permission[] = ['READ_INCOME_TRANSACTIONS', 'READ_EXPENSE_TRANSACTIONS'];


export function transactionsQuery(listId: string) {
	return {
		queryKey: transactionKeys.forList(listId),
		queryFn: () => fetchTransactions(listId),
	};
}


export function useTransactions(listId: string) {
	const { hasAnyPermission } = useAuth();

	return useQuery({
		...transactionsQuery(listId),
		enabled: listId !== '' && hasAnyPermission(TRANSACTION_READ_PERMISSIONS),
	});
}


export function usePrefetchTransactions() {
	const queryClient = useQueryClient();

	return (listId: string) => {
		void queryClient.prefetchQuery({ ...transactionsQuery(listId), meta: { silent: true } });
	};
}
