import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { personKeys } from '@/modules/persons/api/personKeys';
import { createGroup, updateGroup } from '../api/groupsApi';
import { groupKeys } from '../api/groupKeys';
import type { CreateGroupPayload, GroupView, UpdateGroupPayload } from '../types/types.ts';


export function useCreateGroup() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateGroupPayload) => createGroup(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: groupKeys.list() }),
	});
}


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
				groups?.map((group) => (group.id === id ? { ...group, ...payload } : group)),
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


/** Drops the authoritative version of a row the backend just handed back into the cached list. */
function replaceGroup(queryClient: QueryClient, updated: GroupView): void {
	queryClient.setQueryData<GroupView[]>(groupKeys.list(), (groups) =>
		groups?.map((group) => (group.id === updated.id ? updated : group)),
	);
}
