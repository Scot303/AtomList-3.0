import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { addOneOffPayment, deleteOneOffPayment, settlePayment, updateOneOffPayment, updatePayment, updatePaymentQuantity, } from '../api/paymentsApi';
import { paymentListKeys } from '../api/paymentListKeys';
import type { PaymentView, SaveOneOffPaymentPayload, SettleDirectPayload, UpdatePaymentPayload, UpdateQuantityPayload, } from '../types/types.ts';


/** Which list's cached rows to patch. Not sent to the backend, which finds the payment by its own id. */
interface ListScoped {
	listId: string;
}


/* ------------------ UPDATE ------------------ */

export interface UpdatePaymentVariables extends ListScoped {
	id: string;
	payload: UpdatePaymentPayload;
}


export function useUpdatePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdatePaymentVariables) => updatePayment(id, payload),

		onMutate: async ({ id, listId, payload }) => {
			const key = paymentListKeys.payments(listId);

			await queryClient.cancelQueries({ queryKey: key });

			const previous = queryClient.getQueryData<PaymentView[]>(key);

			queryClient.setQueryData<PaymentView[]>(key, (payments) =>
				payments?.map((payment) => ( payment.id === id ? { ...payment, ...payload } : payment )),
			);

			return { previous };
		},

		onSuccess: (updated, { listId }) => acceptPayment(queryClient, listId, updated),

		onError: (_error, { listId }, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(paymentListKeys.payments(listId), context.previous);
			}
		},
	});
}


/* ------------------ SETTLE ------------------ */

export interface SettlePaymentVariables extends ListScoped {
	id: string;
	payload: SettleDirectPayload;
}


/**
 * Money handed over for this one charge.
 */
export function useSettlePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: SettlePaymentVariables) => settlePayment(id, payload),
		onSuccess: (updated, { listId }) => acceptPayment(queryClient, listId, updated),
	});
}


/* ------------------ ADD ONE-OFF ------------------ */

export interface AddOneOffVariables extends ListScoped {
	payload: SaveOneOffPaymentPayload;
}


export function useAddOneOffPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ listId, payload }: AddOneOffVariables) => addOneOffPayment(listId, payload),

		onSuccess: () => invalidateEverything(queryClient),
	});
}


/* ------------------ UPDATE ONE-OFF ------------------ */

export interface UpdateOneOffVariables extends ListScoped {
	id: string;
	payload: SaveOneOffPaymentPayload;
}


/** Edits a hand-added charge. Refused on one that comes from a membership, and once it charges less than was paid. */
export function useUpdateOneOffPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateOneOffVariables) => updateOneOffPayment(id, payload),
		onSuccess: (updated, { listId }) => acceptPayment(queryClient, listId, updated),
	});
}


/* ------------------ UPDATE QUANTITY ------------------ */

export interface UpdateQuantityVariables extends ListScoped {
	id: string;
	payload: UpdateQuantityPayload;
}


/** How many classes somebody attended. Refused on a flat monthly fee, which is charged once. */
export function useUpdateQuantity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateQuantityVariables) => updatePaymentQuantity(id, payload),
		onSuccess: (updated, { listId }) => acceptPayment(queryClient, listId, updated),
	});
}


/* ------------------ DELETE ONE-OFF ------------------ */

export interface DeleteOneOffVariables extends ListScoped {
	id: string;
}


/** Refused once anything has been paid towards the charge: that settlement has to be undone first. */
export function useDeleteOneOffPayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id }: DeleteOneOffVariables) => deleteOneOffPayment(id),

		onSuccess: (_result, { id, listId }) => {
			// immediately removes the row from the current list UI
			queryClient.setQueryData<PaymentView[]>(paymentListKeys.payments(listId), (payments) =>
				payments?.filter((payment) => payment.id !== id),
			);

			// deletes the cached single-payment detail for an entity that no longer exists. Invalidation would leave that stale detail in cache.
			queryClient.removeQueries({ queryKey: paymentListKeys.payment(id) });

			// marks every payment-list-related query stale and refetches active ones. Needed because deleting a charge can change related data.
			invalidateEverything(queryClient);
		},
	});
}


/* ------------------ INTERNALS ------------------ */

/**
 * Takes the authoritative row the backend handed back, then lets everything derived from it go stale.
 */
function acceptPayment(queryClient: QueryClient, listId: string, updated: PaymentView): void {
	queryClient.setQueryData<PaymentView[]>(paymentListKeys.payments(listId), (payments) =>
		payments?.map((payment) => ( payment.id === updated.id ? { ...updated, settlements: payment.settlements } : payment )),
	);

	queryClient.setQueryData<PaymentView>(paymentListKeys.payment(updated.id), updated);

	invalidateEverything(queryClient);
}


function invalidateEverything(queryClient: QueryClient): void {
	void queryClient.invalidateQueries({ queryKey: paymentListKeys.all });
}
