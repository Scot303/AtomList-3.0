import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentListKeys } from '@/modules/paymentLists/api/paymentListKeys';
import { createMembership, deleteMembership, fetchMemberships, leaveMembership, updateMembership, } from '../api/membershipsApi';
import { personKeys } from '../api/personKeys';
import type { CreateMembershipPayload, UpdateMembershipPayload } from '../types/types.ts';


/**
 * Shared by the hook and the prefetch below.
 */
function membershipsQuery(personId: string) {
	return {
		queryKey: personKeys.memberships(personId),
		queryFn: () => fetchMemberships(personId),
	};
}


export function useMemberships(personId: string) {
	return useQuery(membershipsQuery(personId));
}


/**
 * Starts one person's membership history on its way before anything asks to see it.
 */
export function usePrefetchMemberships() {
	const queryClient = useQueryClient();

	return useCallback(
		(personId: string) => {
			void queryClient.prefetchQuery({ ...membershipsQuery(personId), meta: { silent: true } });
		},
		[queryClient],
	);
}


/**
 * Everything a membership change touches.
 */
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


export function useCreateMembership(personId: string) {
	const invalidate = useMembershipInvalidation(personId);

	return useMutation({
		mutationFn: (payload: CreateMembershipPayload) => createMembership(personId, payload),
		onSuccess: invalidate,
	});
}


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


export interface LeaveMembershipVariables {
	id: string;
	/** `YYYY-MM-DD`. Defaults to today on the backend. */
	leftAt?: string;
}


export function useLeaveMembership(personId: string) {
	const invalidate = useMembershipInvalidation(personId);

	return useMutation({
		mutationFn: ({ id, leftAt }: LeaveMembershipVariables) => leaveMembership(id, leftAt),
		onSuccess: invalidate,
	});
}


export function useDeleteMembership(personId: string) {
	const invalidate = useMembershipInvalidation(personId);

	return useMutation({
		mutationFn: (id: string) => deleteMembership(id),
		onSuccess: invalidate,
	});
}
