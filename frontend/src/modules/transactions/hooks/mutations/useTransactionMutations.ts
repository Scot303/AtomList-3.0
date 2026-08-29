import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentListKeys } from '@/modules/paymentLists/api/paymentListKeys.ts';
import { createTransaction, deleteTransaction, updateTransaction } from '../../api/transactionsApi.ts';
import { transactionKeys } from '../../api/transactionKeys.ts';
import type { CreateTransactionPayload, TransactionView, UpdateTransactionPayload } from '../../types/types.ts';


/** Which list's cached rows to patch. Not sent to the backend, which finds the transaction by its own id. */
interface ListScoped {
	listId: string;
}


/* ------------------ CREATE ------------------ */

export interface CreateTransactionVariables extends ListScoped {
	payload: CreateTransactionPayload;
}


export function useCreateTransaction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ listId, payload }: CreateTransactionVariables) => createTransaction(listId, payload),

		onSuccess: (created, { listId }) => {
			queryClient.setQueryData<TransactionView[]>(transactionKeys.forList(listId), (rows) =>
				rows === undefined ? undefined : [...rows, created],
			);

			invalidateEverything(queryClient, listId);
		},
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdateTransactionVariables extends ListScoped {
	id: string;
	payload: UpdateTransactionPayload;
}


export function useUpdateTransaction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateTransactionVariables) => updateTransaction(id, payload),

		onMutate: async ({ id, listId, payload }) => {
			const key = transactionKeys.forList(listId);

			await queryClient.cancelQueries({ queryKey: key });

			const previous = queryClient.getQueryData<TransactionView[]>(key);

			queryClient.setQueryData<TransactionView[]>(key, (rows) =>
				rows?.map((row) => ( row.id === id ? withTotal({ ...row, ...payload }) : row )),
			);

			return { previous };
		},

		onSuccess: (updated, { listId }) => {
			queryClient.setQueryData<TransactionView[]>(transactionKeys.forList(listId), (rows) =>
				rows?.map((row) => ( row.id === updated.id ? updated : row )),
			);

			invalidateEverything(queryClient, listId);
		},

		onError: (_error, { listId }, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(transactionKeys.forList(listId), context.previous);
			}
		},
	});
}


/* ------------------ DELETE ------------------ */

export interface DeleteTransactionVariables extends ListScoped {
	id: string;
}


export function useDeleteTransaction() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id }: DeleteTransactionVariables) => deleteTransaction(id),

		onSuccess: (_result, { id, listId }) => {
			queryClient.setQueryData<TransactionView[]>(transactionKeys.forList(listId), (rows) =>
				rows?.filter((row) => row.id !== id),
			);

			invalidateEverything(queryClient, listId);
		},
	});
}


/* ------------------ INTERNALS ------------------ */

function withTotal(row: TransactionView): TransactionView {
	return { ...row, total: Math.round(row.amount * row.quantity * 100) / 100 };
}


function invalidateEverything(queryClient: QueryClient, listId: string): void {
	void queryClient.invalidateQueries({ queryKey: transactionKeys.forList(listId) });
	void queryClient.invalidateQueries({ queryKey: paymentListKeys.all });
}
