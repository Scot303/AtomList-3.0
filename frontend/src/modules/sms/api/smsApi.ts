import { axiosInstance } from '@/api/axiosInstance';
import { SMS_ENDPOINTS } from '@/api/endpoints';
import type { SendSmsPayload, SmsSendResultView, SmsView } from '../types/types.ts';


/** Every message the studio has sent, newest first. */
export async function fetchSmsHistory(): Promise<SmsView[]> {
	const { data } = await axiosInstance.get<SmsView[]>(SMS_ENDPOINTS.base);

	return data;
}


/**
 * Sends one message to everybody named and everybody attending the groups named.
 *
 * Anybody without a reachable number comes back under `skipped` rather than failing the whole SMS delivery.
 */
export async function sendSms(payload: SendSmsPayload): Promise<SmsSendResultView> {
	const { data } = await axiosInstance.post<SmsSendResultView>(SMS_ENDPOINTS.base, payload);

	return data;
}
