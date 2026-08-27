import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentListKeys } from '@/modules/paymentLists/api/paymentListKeys.ts';
import { createMembership, deleteMembership, leaveMembership, updateMembership } from '../../api/membershipsApi.ts';
import { personKeys } from '../../api/personKeys.ts';
import type { CreateMembershipPayload, UpdateMembershipPayload } from '../../types/types.ts';


/* ------------------ INVALIDATE ------------------ */

/** Everything a membership change touches. */
function useMembershipInvalidation(personId: string) {
	const queryClient = useQueryClient();

	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: personKeys.memberships(personId) }),
			queryClient.invalidateQueries({ queryKey: personKeys.list() }),
			queryClient.invalidateQueries({ queryKey: paymentListKeys.all }),
			queryClient.invalidateQueries({ queryKey: personKeys.discounts() }),
		]);
}


/* ------------------ CREATE ------------------ */

export function useCreateMembership(personId: string) {
	const invalidate = useMembershipInvalidation(personId);

	return useMutation({
		mutationFn: (payload: CreateMembershipPayload) => createMembership(personId, payload),
		onSuccess: invalidate,
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdateMembershipVariables {
	id: string;
	payload: UpdateMembershipPayload;
}


export function useUpdateMembership(personId: string) {
	const invalidate = useMembershipInvalidation(personId);

	return useMutation({
		mutationFn: ({ id, payload }: UpdateMembershipVariables) => updateMembership(id, payload),
		onSuccess: invalidate,
	});
}


/* ------------------ LEAVE ------------------ */

export interface LeaveMembershipVariables {
	id: string;
	leftAt?: string;
}


export function useLeaveMembership(personId: string) {
	const invalidate = useMembershipInvalidation(personId);

	return useMutation({
		mutationFn: ({ id, leftAt }: LeaveMembershipVariables) => leaveMembership(id, leftAt),
		onSuccess: invalidate,
	});
}


/* ------------------ DELETE ------------------ */

export function useDeleteMembership(personId: string) {
	const invalidate = useMembershipInvalidation(personId);

	return useMutation({
		mutationFn: (id: string) => deleteMembership(id),
		onSuccess: invalidate,
	});
}
