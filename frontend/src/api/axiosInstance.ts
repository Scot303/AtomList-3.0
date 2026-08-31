import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { canRenewSession, endSession, getAccessToken, renewSession } from './authBridge';
import { API_BASE_URL, API_LANGUAGE, CSRF_HEADER, REQUEST_TIMEOUT_MS } from './config';
import { ANONYMOUS_PATHS, NO_TOKEN_RENEWAL_PATHS } from './endpoints';
import { ErrorCode, toApiError } from './errors';


declare module 'axios' {
	export interface AxiosRequestConfig {
		/** Opts a single request out of the automatic renew-and-retry on a 401. */
		skipTokenRenewal?: boolean;
		/** Set internally. Guarantees a request is only ever replayed once. */
		tokenRenewalAttempted?: boolean;
	}
}

/**
 * The client every part of the application talks to the API through.
 */
export const axiosInstance = axios.create({
	baseURL: API_BASE_URL,
	timeout: REQUEST_TIMEOUT_MS,

	// Cross-site request without it silently drops the cookie rather than failing loudly.
	withCredentials: true,

	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		'Accept-Language': API_LANGUAGE,
	},
});


axiosInstance.interceptors.request.use((config) => {
	const token = getAccessToken();

	if (token !== null && !matchesPath(config.url, ANONYMOUS_PATHS)) {
		config.headers.set('Authorization', `Bearer ${ token }`);
	}

	config.headers.set(CSRF_HEADER, '1');

	return config;
});


axiosInstance.interceptors.response.use(
	(response) => response,
	async (error: unknown) => {
		if (!axios.isAxiosError(error) || !error.config) {
			throw toApiError(error);
		}

		const config = error.config as InternalAxiosRequestConfig;
		const status = error.response?.status;

		await unwrapBlobErrorBody(error);

		if (status === 401 && shouldRenewToken(config)) {
			config.tokenRenewalAttempted = true;

			try {
				await renewSession();
			} catch {
				throw toApiError(error);
			}

			return axiosInstance(config);
		}

		const apiError = toApiError(error);

		if (apiError.is(ErrorCode.accountInactive)) {
			endSession();
		}

		throw apiError;
	},
);


/**
 * Replaces a Blob error body with the JSON it holds, so the rest of the error path sees the same
 * shape it would have for an ordinary request. Leaves the body alone if it is not JSON.
 */
async function unwrapBlobErrorBody(error: AxiosError): Promise<void> {
	const data: unknown = error.response?.data;

	if (!error.response || !( data instanceof Blob ) || !data.type.includes('json')) {
		return;
	}

	try {
		error.response.data = JSON.parse(await data.text());
	} catch {
		// Truncated or not actually JSON.
	}
}


function shouldRenewToken(config: InternalAxiosRequestConfig): boolean {
	if (config.skipTokenRenewal === true || config.tokenRenewalAttempted === true) {
		return false;
	}

	if (!canRenewSession()) {
		return false;
	}

	return !matchesPath(config.url, NO_TOKEN_RENEWAL_PATHS);
}


function matchesPath(url: string | undefined, paths: readonly string[]): boolean {
	if (url === undefined) {
		return false;
	}

	const path = url.split('?')[0];

	// endsWith covers a caller that passed an absolute URL rather than a path relative to baseURL.
	return paths.some((candidate) => path === candidate || path.endsWith(candidate));
}
