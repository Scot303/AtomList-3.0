import { axiosInstance } from '@/api/axiosInstance';
import { TRANSACTION_ENDPOINTS } from '@/api/endpoints';
import type { CreateTransactionPayload, TransactionView, UpdateTransactionPayload } from '../types/types.ts';


/** Only the kinds the caller may read come back. */
export async function fetchTransactions(listId: string): Promise<TransactionView[]> {
	const { data } = await axiosInstance.get<TransactionView[]>(TRANSACTION_ENDPOINTS.forList(listId));

	return data;
}


export async function createTransaction(listId: string, payload: CreateTransactionPayload): Promise<TransactionView> {
	const { data } = await axiosInstance.post<TransactionView>(TRANSACTION_ENDPOINTS.forList(listId), payload);

	return data;
}


export async function updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<TransactionView> {
	const { data } = await axiosInstance.patch<TransactionView>(TRANSACTION_ENDPOINTS.byId(id), payload);

	return data;
}


export async function deleteTransaction(id: string): Promise<void> {
	await axiosInstance.delete(TRANSACTION_ENDPOINTS.byId(id));
}
