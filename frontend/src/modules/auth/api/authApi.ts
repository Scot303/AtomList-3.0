import { axiosInstance } from '@/api/axiosInstance';
import { AUTH_ENDPOINTS } from '@/api/endpoints';
import { rethrowAsApiError } from '@/api/errors';
import type { LoginResponse, UserInfo } from '@/types/auth';


export interface VerifyLoginCodeInput {
	identifier: string;
	code: string;
}

/**
 * Asks for a one-time code by username or email.
 */
export async function requestLoginCode(identifier: string): Promise<void> {
	await axiosInstance.post(AUTH_ENDPOINTS.requestLoginCode, { identifier });
}

/** Exchanges the mailed code for an access token and the user it belongs to. */
export async function verifyLoginCode(input: VerifyLoginCodeInput): Promise<LoginResponse> {
	const { data } = await axiosInstance.post<LoginResponse>(AUTH_ENDPOINTS.verifyLoginCode, input);
	return data;
}

/**
 * Re-reads the current user, including any permission change made since signing in.
 *
 * Normalized here rather than at the call site because the auth provider has to tell a failure
 * that ended the session from one that only means the server was unreachable.
 */
export async function fetchCurrentUser(): Promise<UserInfo> {
	const { data } = await axiosInstance.get<UserInfo>(AUTH_ENDPOINTS.me).catch(rethrowAsApiError);

	return data;
}

/** Confirms an address from a mailed link. */
export async function verifyEmail(token: string): Promise<void> {
	await axiosInstance.post(AUTH_ENDPOINTS.verifyEmail, { token });
}

/** Re-sends a confirmation link. Silent about whether anything was actually sent. */
export async function resendVerification(identifier: string): Promise<void> {
	await axiosInstance.post(AUTH_ENDPOINTS.resendVerification, { identifier });
}

/** Ends every session this account holds, on every device. Needs a valid access token. */
export async function logoutEverywhere(): Promise<void> {
	await axiosInstance.post(AUTH_ENDPOINTS.logoutEverywhere);
}
