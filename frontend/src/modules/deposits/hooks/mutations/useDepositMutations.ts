import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentListKeys } from '@/modules/paymentLists/api/paymentListKeys.ts';
import { allocateDeposit, createDeposit, deleteDeposit, planDeposit, removeDepositSettlement, } from '../../api/depositsApi.ts';
import { depositKeys } from '../../api/depositKeys.ts';
import type { AllocateDepositPayload, CreateDepositPayload, PlanDepositPayload, } from '../../types/types.ts';


/* ------------------ PLAN ------------------ */

export function usePlanDeposit() {
	return useMutation({
		mutationFn: (payload: PlanDepositPayload) => planDeposit(payload),
	});
}


/* ------------------ SETTLES PLAN ------------------ */

export function useCreateDeposit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateDepositPayload) => createDeposit(payload),
		onSuccess: () => invalidateMoney(queryClient),
	});
}


/* ------------------ ALLOCATE ------------------ */

export interface AllocateDepositVariables {
	id: string;
	payload: AllocateDepositPayload;
}


/** Spends what is left of a deposit: against the payments named, or wherever a fresh plan would put it. */
export function useAllocateDeposit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: AllocateDepositVariables) => allocateDeposit(id, payload),
		onSuccess: () => invalidateMoney(queryClient),
	});
}


/* ------------------ REMOVE SETTLEMENT ------------------ */

export interface RemoveSettlementVariables {
	depositId: string;
	settlementId: string;
}


/**
 * Undoes one allocation, leaving that debt owing again and returning the money to its deposit's credit.
 *
 * Refused for money counted on a list that has since been closed.
 */
export function useRemoveDepositSettlement() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ depositId, settlementId }: RemoveSettlementVariables) => removeDepositSettlement(depositId, settlementId),
		onSuccess: () => invalidateMoney(queryClient),
	});
}


/* ------------------ DELETE ------------------ */

export function useDeleteDeposit() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteDeposit(id),
		onSuccess: () => invalidateMoney(queryClient),
	});
}


/* ------------------ INVALIDATE ------------------ */

function invalidateMoney(queryClient: QueryClient): void {
	void queryClient.invalidateQueries({ queryKey: depositKeys.all });
	void queryClient.invalidateQueries({ queryKey: paymentListKeys.all });
}
