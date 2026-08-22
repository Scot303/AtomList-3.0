import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchOverpayments, settleOverpayments } from '../api/paymentListsApi';
import { paymentListKeys } from '../api/paymentListKeys';
import type { SettleCreditPayload } from '../types/types.ts';


/**
 * Everybody's leftover credit, and what it would settle on this list.
 */
export function useCreditSweep(listId: string, enabled = true) {
	const { hasPermission } = useAuth();

	return useQuery({
		queryKey: paymentListKeys.overpayments(listId),
		queryFn: () => fetchOverpayments(listId),
		enabled: enabled && listId !== '' && hasPermission('READ_LISTS') && hasPermission('READ_PAYMENTS'),
	});
}


export interface SettleOverpaymentsVariables {
	listId: string;
	payload: SettleCreditPayload;
}


/**
 * Spends that credit.
 */
export function useSettleOverpayments() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ listId, payload }: SettleOverpaymentsVariables) => settleOverpayments(listId, payload),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: paymentListKeys.all }),
	});
}
