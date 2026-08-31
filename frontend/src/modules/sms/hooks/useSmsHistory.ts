import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchSmsHistory } from '../api/smsApi';
import { smsKeys } from '../api/smsKeys';


export function smsHistoryQuery() {
	return {
		queryKey: smsKeys.list(),
		queryFn: fetchSmsHistory,
	};
}


export function useSmsHistory() {
	const { hasPermission } = useAuth();

	return useQuery({
		...smsHistoryQuery(),
		enabled: hasPermission('READ_SMS'),
	});
}


export function usePrefetchSmsHistory() {
	const queryClient = useQueryClient();

	return () => {
		void queryClient.prefetchQuery({ ...smsHistoryQuery(), meta: { silent: true } });
	};
}
