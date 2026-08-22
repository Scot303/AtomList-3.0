import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { addPersonsToList, closeList, createCustomList, deletePaymentList, recalculateList, reopenList, repopulateList, updateCustomList, } from '../api/paymentListsApi';
import { paymentListKeys } from '../api/paymentListKeys';
import type { AddPersonsPayload, CreateCustomListPayload, PaymentListView, UpdateCustomListPayload } from '../types/types.ts';


/* ------------------ CREATE ------------------ */

export function useCreateCustomList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateCustomListPayload) => createCustomList(payload),
		onSuccess: (list) => acceptList(queryClient, list),
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdateCustomListVariables {
	id: string;
	payload: UpdateCustomListPayload;
}


export function useUpdateCustomList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateCustomListVariables) => updateCustomList(id, payload),
		onSuccess: (list) => acceptList(queryClient, list),
	});
}


/* ------------------ RECALCULATE ------------------ */

/** Rebuilds every amount from the current memberships and discount configuration. */
export function useRecalculateList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => recalculateList(id),
		onSuccess: (list) => acceptList(queryClient, list),
	});
}


/* ------------------ REPOPULATE ------------------ */

export function useRepopulateList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => repopulateList(id),
		onSuccess: (list) => acceptList(queryClient, list),
	});
}


/* ------------------ ADD-PERSON ------------------ */

export interface AddPersonsVariables {
	id: string;
	payload: AddPersonsPayload;
}


export function useAddPersonsToList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: AddPersonsVariables) => addPersonsToList(id, payload),
		onSuccess: (list) => acceptList(queryClient, list),
	});
}


/* ------------------ CLOSE LIST ------------------ */

export function useCloseList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => closeList(id),
		onSuccess: (list) => acceptList(queryClient, list),
	});
}


/* ------------------ REOPEN LIST ------------------ */

export function useReopenList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => reopenList(id),
		onSuccess: (list) => acceptList(queryClient, list),
	});
}


/* ------------------ DELETE ------------------ */

/** Only for a list created by mistake: refused once closed or once any money has been recorded on it. */
export function useDeletePaymentList() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deletePaymentList(id),

		onSuccess: (_result, id) => {
			queryClient.removeQueries({ queryKey: paymentListKeys.byId(id) });
			queryClient.removeQueries({ queryKey: paymentListKeys.payments(id) });

			void queryClient.invalidateQueries({ queryKey: paymentListKeys.all });
		},
	});
}


/* ------------------ INTERNALS ------------------ */

function acceptList(queryClient: QueryClient, list: PaymentListView): void {
	queryClient.setQueryData<PaymentListView>(paymentListKeys.byId(list.id), list);

	void queryClient.invalidateQueries({ queryKey: paymentListKeys.all });
}
