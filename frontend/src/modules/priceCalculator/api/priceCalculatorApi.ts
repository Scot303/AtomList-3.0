import { axiosInstance } from '@/api/axiosInstance';
import { PRICE_QUOTE_ENDPOINTS } from '@/api/endpoints';
import type { PriceQuotePayload, PriceQuoteView } from '../types/types.ts';


export async function postPriceQuote(payload: PriceQuotePayload): Promise<PriceQuoteView> {
	const { data } = await axiosInstance.post<PriceQuoteView>(PRICE_QUOTE_ENDPOINTS.base, payload);

	return data;
}
