import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchInstructors } from '../api/instructorsApi.ts';
import { instructorKeys } from '../api/instructorKeys.ts';


export function instructorsQuery() {
	return {
		queryKey: instructorKeys.list(),
		queryFn: fetchInstructors,
	};
}


export function useInstructors() {
	const { hasPermission } = useAuth();

	return useQuery({
		...instructorsQuery(),
		enabled: hasPermission('READ_INSTRUCTORS'),
	});
}


export function usePrefetchInstructors() {
	const queryClient = useQueryClient();

	return () => {
		void queryClient.prefetchQuery({ ...instructorsQuery(), meta: { silent: true } });
	};
}
