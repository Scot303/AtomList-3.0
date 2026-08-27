import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendSms } from '../api/smsApi';
import { smsKeys } from '../api/smsKeys';
import type { SendSmsPayload } from '../types/types.ts';


export function useSendSms() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: SendSmsPayload) => sendSms(payload),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: smsKeys.all });
		},
	});
}
