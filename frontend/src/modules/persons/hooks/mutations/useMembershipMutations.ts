import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentListKeys } from '@/modules/paymentLists/api/paymentListKeys.ts';
import { createMembership, deleteMembership, leaveMembership, updateMembership } from '../../api/membershipsApi.ts';
import { personKeys } from '../../api/personKeys.ts';
import { ROW_SETTLE_MS } from '../../components/membershipRow/rowMotion.ts';
import type { CreateMembershipPayload, MembershipView, UpdateMembershipPayload } from '../../types/types.ts';


/* ------------------ CACHE ------------------ */

function byJoinedAtDesc(a: MembershipView, b: MembershipView): number {
	return b.joinedAt.localeCompare(a.joinedAt);
}


function useMembershipCache(personId: string) {
	const queryClient = useQueryClient();

	return (apply: (current: MembershipView[]) => MembershipView[]) => {
		queryClient.setQueryData<MembershipView[]>(
			personKeys.memberships(personId),
			(current) => ( current === undefined ? undefined : apply(current) ),
		);
	};
}


/* ------------------ INVALIDATE ------------------ */

/**
 * Everything a membership change touches, refreshed once the row has stopped moving.
 */
function useMembershipInvalidation() {
	const queryClient = useQueryClient();

	return () => {
		setTimeout(() => {
			void queryClient.invalidateQueries({ queryKey: personKeys.list() });
			void queryClient.invalidateQueries({ queryKey: paymentListKeys.all });
			void queryClient.invalidateQueries({ queryKey: personKeys.discounts() });
		}, ROW_SETTLE_MS);
	};
}


/* ------------------ CREATE ------------------ */

export function useCreateMembership(personId: string) {
	const writeCache = useMembershipCache(personId);
	const invalidate = useMembershipInvalidation();

	return useMutation({
		mutationFn: (payload: CreateMembershipPayload) => createMembership(personId, payload),

		onSuccess: (created) => {
			writeCache((current) => [...current, created].sort(byJoinedAtDesc));

			invalidate();
		},
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdateMembershipVariables {
	id: string;
	payload: UpdateMembershipPayload;
}


export function useUpdateMembership(personId: string) {
	const writeCache = useMembershipCache(personId);
	const invalidate = useMembershipInvalidation();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateMembershipVariables) => updateMembership(id, payload),

		onSuccess: (saved) => {
			writeCache((current) => current.map((membership) => ( membership.id === saved.id ? saved : membership )).sort(byJoinedAtDesc));

			invalidate();
		},
	});
}


/* ------------------ LEAVE ------------------ */

export interface LeaveMembershipVariables {
	id: string;
	leftAt?: string;
}


export function useLeaveMembership(personId: string) {
	const writeCache = useMembershipCache(personId);
	const invalidate = useMembershipInvalidation();

	return useMutation({
		mutationFn: ({ id, leftAt }: LeaveMembershipVariables) => leaveMembership(id, leftAt),

		onSuccess: (saved) => {
			writeCache((current) => current.map((membership) => ( membership.id === saved.id ? saved : membership )));

			invalidate();
		},
	});
}


/* ------------------ DELETE ------------------ */

export function useDeleteMembership(personId: string) {
	const writeCache = useMembershipCache(personId);
	const invalidate = useMembershipInvalidation();

	return useMutation({
		mutationFn: (id: string) => deleteMembership(id),

		onSuccess: (_response, id) => {
			writeCache((current) => current.filter((membership) => membership.id !== id));

			invalidate();
		},
	});
}
