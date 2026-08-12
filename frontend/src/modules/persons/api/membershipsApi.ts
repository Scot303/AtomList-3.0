import { axiosInstance } from '@/api/axiosInstance';
import { MEMBERSHIP_ENDPOINTS, PERSON_ENDPOINTS } from '@/api/endpoints';
import type { CreateMembershipPayload, MembershipView, UpdateMembershipPayload } from '../types/types.ts';

/** One person's whole history, running and ended alike, newest first. */
export async function fetchMemberships(personId: string): Promise<MembershipView[]> {
	const { data } = await axiosInstance.get<MembershipView[]>(PERSON_ENDPOINTS.memberships(personId));

	return data;
}

export async function createMembership(personId: string, payload: CreateMembershipPayload): Promise<MembershipView> {
	const { data } = await axiosInstance.post<MembershipView>(PERSON_ENDPOINTS.memberships(personId), payload);

	return data;
}

export async function updateMembership(id: string, payload: UpdateMembershipPayload): Promise<MembershipView> {
	const { data } = await axiosInstance.patch<MembershipView>(MEMBERSHIP_ENDPOINTS.byId(id), payload);

	return data;
}

/**
 * Ends a membership by dating it. The row stays, so a past list can still explain the figure it charged.
 */
export async function leaveMembership(id: string, leftAt?: string): Promise<MembershipView> {
	const { data } = await axiosInstance.post<MembershipView>(MEMBERSHIP_ENDPOINTS.leave(id), null, {
		params: leftAt ? { leftAt } : undefined,
	});

	return data;
}

/**
 * Removes the row outright. For a membership recorded by mistake.
 */
export async function deleteMembership(id: string): Promise<void> {
	await axiosInstance.delete(MEMBERSHIP_ENDPOINTS.byId(id));
}
