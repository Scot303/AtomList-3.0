import axios from 'axios';

import { API_BASE_URL, API_LANGUAGE, CSRF_HEADER, REQUEST_TIMEOUT_MS } from './config';

/**
 * A second, deliberately plain axios instance for the two endpoints that authenticate from the
 * refresh cookie rather than from a bearer token: /api/auth/refresh and /api/auth/logout.
 *
 * It carries no interceptors, which is the whole point - the main instance renews the session on a
 * 401, and renewing the session is exactly what these calls do. Sharing an instance would let a
 * failing refresh trigger another refresh.
 */
export const refreshClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: REQUEST_TIMEOUT_MS,

	withCredentials: true,

	headers: {
		Accept: 'application/json',
		'Accept-Language': API_LANGUAGE,
		[CSRF_HEADER]: '1',
	},
});
