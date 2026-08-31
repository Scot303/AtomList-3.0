import { axiosInstance } from '@/api/axiosInstance';
import { PAYMENT_ENDPOINTS } from '@/api/endpoints';
import type { PaymentView, SaveOneOffPaymentPayload, SettleDirectPayload, UpdatePaymentPayload, UpdateQuantityPayload, } from '../types/types.ts';


export async function fetchPayments(listId: string): Promise<PaymentView[]> {
	const { data } = await axiosInstance.get<PaymentView[]>(PAYMENT_ENDPOINTS.forList(listId));

	return data;
}


/** One charge, with the settlements that paid it. */
export async function fetchPayment(id: string): Promise<PaymentView> {
	const { data } = await axiosInstance.get<PaymentView>(PAYMENT_ENDPOINTS.byId(id));

	return data;
}


/** The note, and the returned contract on a camp list. Nothing about money. */
export async function updatePayment(id: string, payload: UpdatePaymentPayload): Promise<PaymentView> {
	const { data } = await axiosInstance.patch<PaymentView>(PAYMENT_ENDPOINTS.byId(id), payload);

	return data;
}


/**
 * Records money handed over for this one charge, as a deposit of its own.
 */
export async function settlePayment(id: string, payload: SettleDirectPayload): Promise<PaymentView> {
	const { data } = await axiosInstance.post<PaymentView>(PAYMENT_ENDPOINTS.settle(id), payload);

	return data;
}


/** Adds a charge for this list only, belonging to no group. */
export async function addOneOffPayment(listId: string, payload: SaveOneOffPaymentPayload): Promise<PaymentView> {
	const { data } = await axiosInstance.post<PaymentView>(PAYMENT_ENDPOINTS.forList(listId), payload);

	return data;
}


/** Edits a hand-added charge. Refused on one that comes from a membership. */
export async function updateOneOffPayment(id: string, payload: SaveOneOffPaymentPayload): Promise<PaymentView> {
	const { data } = await axiosInstance.put<PaymentView>(PAYMENT_ENDPOINTS.byId(id), payload);

	return data;
}


/** How many classes somebody attended. Refused on a flat monthly fee. */
export async function updatePaymentQuantity(id: string, payload: UpdateQuantityPayload): Promise<PaymentView> {
	const { data } = await axiosInstance.patch<PaymentView>(PAYMENT_ENDPOINTS.quantity(id), payload);

	return data;
}


export async function deleteOneOffPayment(id: string): Promise<void> {
	await axiosInstance.delete(PAYMENT_ENDPOINTS.byId(id));
}
