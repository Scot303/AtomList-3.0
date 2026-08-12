import { axiosInstance } from '@/api/axiosInstance';
import { ADMIN_USER_ENDPOINTS } from '@/api/endpoints';
import type { AdminUserView, CreateUserPayload, UpdateUserPayload } from '../types/types.ts';

/** Every account in one response, already sorted by username. */
export async function fetchUsers(): Promise<AdminUserView[]> {
	const { data } = await axiosInstance.get<AdminUserView[]>(ADMIN_USER_ENDPOINTS.base);

	return data;
}

/** Creates the account and, on the backend's own initiative, mails the verification link. */
export async function createUser(payload: CreateUserPayload): Promise<AdminUserView> {
	const { data } = await axiosInstance.post<AdminUserView>(ADMIN_USER_ENDPOINTS.base, payload);

	return data;
}

/** Sends only the fields being changed; the backend leaves the rest alone. */
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminUserView> {
	const { data } = await axiosInstance.patch<AdminUserView>(ADMIN_USER_ENDPOINTS.byId(id), payload);

	return data;
}

/** Ends a lockout early, rather than making the account sit out the remaining time. */
export async function unlockUser(id: string): Promise<AdminUserView> {
	const { data } = await axiosInstance.post<AdminUserView>(ADMIN_USER_ENDPOINTS.unlock(id));

	return data;
}

/** Sends a fresh confirmation link, ignoring the resend cooldown. */
export async function resendVerification(id: string): Promise<void> {
	await axiosInstance.post(ADMIN_USER_ENDPOINTS.resendVerification(id));
}

/**
 * Ends every session the account holds.
 */
export async function forceLogout(id: string): Promise<void> {
	await axiosInstance.post(ADMIN_USER_ENDPOINTS.forceLogout(id));
}
