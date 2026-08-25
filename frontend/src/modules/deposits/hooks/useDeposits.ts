import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchDeposit, fetchDepositByCode, fetchDeposits } from '../api/depositsApi';
import { depositKeys } from '../api/depositKeys';


/* ------------------ MULTIPLE ------------------ */

export function depositsQuery(year: number | null) {
	return {
		queryKey: depositKeys.history(year),
		queryFn: () => fetchDeposits(year),
	};
}


export function useDeposits(year: number | null) {
	const { hasPermission } = useAuth();

	return useQuery({
		...depositsQuery(year),
		enabled: hasPermission('READ_PAYMENTS'),
		placeholderData: keepPreviousData,
	});
}


export function usePrefetchDeposits() {
	const queryClient = useQueryClient();

	return (year: number) => {
		void queryClient.prefetchQuery({ ...depositsQuery(year), meta: { silent: true } });
	};
}


/* ------------------ SINGLE ------------------ */

export function depositQuery(id: string) {
	return {
		queryKey: depositKeys.byId(id),
		queryFn: () => fetchDeposit(id),
	};
}


export function useDeposit(id: string) {
	const { hasPermission } = useAuth();

	return useQuery({
		...depositQuery(id),
		enabled: id !== '' && hasPermission('READ_PAYMENTS'),
	});
}


export function usePrefetchDeposit() {
	const queryClient = useQueryClient();

	return (id: string) => {
		void queryClient.prefetchQuery({ ...depositQuery(id), meta: { silent: true } });
	};
}


/* ------------------ BY CODE ------------------ */

export function useDepositByCode(code: string) {
	const { hasPermission } = useAuth();

	return useQuery({
		queryKey: depositKeys.byCode(code),
		queryFn: () => fetchDepositByCode(code),
		enabled: code !== '' && hasPermission('READ_PAYMENTS'),
		// A mistyped number is a 404 the user fixes by typing again: no retry, and reported by the dialog that asked rather than by a toast over the top of it.
		retry: false,
		meta: { silent: true },
	});
}
