import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { personKeys } from '@/modules/persons/api/personKeys';
import { createGroup, getAttendanceList, updateGroup } from '../api/groupsApi';
import { groupKeys } from '../api/groupKeys';
import type { CreateGroupPayload, GroupView, UpdateGroupPayload } from '../types/types.ts';
import { useAuth } from "@/modules/auth/hooks/useAuth.ts";
import { downloadTracked, openBlobInNewTab } from "@/lib/download.ts";


/* ------------------ CREATE ------------------ */

export function useCreateGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.list() }),
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdateGroupVariables {
	id: string;
	payload: UpdateGroupPayload;
}


/**
 * Partial update of one group. Applies the change immediately and puts the row back as it was if the backend refuses it.
 */
export function useUpdateGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateGroupVariables) => updateGroup(id, payload),

		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({ queryKey: groupKeys.list() });

			const previous = queryClient.getQueryData<GroupView[]>(groupKeys.list());

			queryClient.setQueryData<GroupView[]>(groupKeys.list(), (groups) =>
				groups?.map((group) => ( group.id === id ? { ...group, ...payload } : group )),
			);

			return { previous };
		},

		onSuccess: (updated) => {
			replaceGroup(queryClient, updated);
			void queryClient.invalidateQueries({ queryKey: personKeys.all });
		},

		onError: (_error, _variables, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(groupKeys.list(), context.previous);
			}
		},
	});
}


/* ------------------ ATTENDANCE ------------------ */

/**
 * Fetches a group's attendance PDF on demand and opens it.
 */
export function usePrintAttendanceList() {
	const { hasPermission } = useAuth();

	const download = useMutation({
		mutationFn: (groupId: string) => downloadTracked({
			fetch: (onTransferStart) => getAttendanceList(groupId, onTransferStart),
			pending: 'Generowanie listy obecności...',
			transferring: 'Lista obecności jest gotowa, pobieranie pliku...',
			done: () => 'Lista obecności została pobrana.',
			deliver: ({ blob, fileName }) => openBlobInNewTab(blob, fileName),
		}),
	});

	return {
		canPrint: hasPermission('PRINT_ATTENDANCE'),
		isPending: download.isPending,
		print: download.mutate,
	};
}


/* ------------------ REPLACE ------------------ */

/** Drops the authoritative version of a row the backend just handed back into the cached list. */
function replaceGroup(queryClient: QueryClient, updated: GroupView): void {
	queryClient.setQueryData<GroupView[]>(groupKeys.list(), (groups) =>
		groups?.map((group) => ( group.id === updated.id ? updated : group )),
	);
}
