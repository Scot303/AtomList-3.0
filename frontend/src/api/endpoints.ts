export const AUTH_ENDPOINTS = {
	requestLoginCode: '/api/auth/otp/request',
	verifyLoginCode: '/api/auth/otp/verify',
	refresh: '/api/auth/refresh',
	me: '/api/auth/me',
	logout: '/api/auth/logout',
	logoutEverywhere: '/api/auth/logout-all',
	verifyEmail: '/api/auth/email/verify',
	resendVerification: '/api/auth/email/resend',
} as const;

/**
 * Endpoints reached before anyone is signed in, which must be called without an Authorization header.
 */
export const ANONYMOUS_PATHS: readonly string[] = [
	AUTH_ENDPOINTS.requestLoginCode,
	AUTH_ENDPOINTS.verifyLoginCode,
	AUTH_ENDPOINTS.verifyEmail,
	AUTH_ENDPOINTS.resendVerification,
];

/**
 * Endpoints that must never trigger the "401 means the access token lapsed, renew it and retry" path.
 * A 401 from any of these is the answer, not a stale token.
 * Retrying would spend the refresh cookie for nothing and hide the real error.
 */
export const NO_TOKEN_RENEWAL_PATHS: readonly string[] = [
	AUTH_ENDPOINTS.requestLoginCode,
	AUTH_ENDPOINTS.verifyLoginCode,
	AUTH_ENDPOINTS.refresh,
	AUTH_ENDPOINTS.logout,
	AUTH_ENDPOINTS.verifyEmail,
	AUTH_ENDPOINTS.resendVerification,
];

/**
 * Account administration. Every one of these needs the `MANAGE_USERS` authority.
 */
export const ADMIN_USER_ENDPOINTS = {
	base: '/api/admin/users',
	byId: (id: string) => `/api/admin/users/${ id }`,
	unlock: (id: string) => `/api/admin/users/${ id }/unlock`,
	resendVerification: (id: string) => `/api/admin/users/${ id }/resend-verification`,
	forceLogout: (id: string) => `/api/admin/users/${ id }/force-logout`,
} as const;