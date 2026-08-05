import axios from 'axios'

/**
 * The shape every error the backend produces on purpose comes back as.
 */
interface BackendErrorBody {
	status: number
	errorCode: string
	message: string
	timestamp: string
}

/**
 * Error codes worth branching on. Anything not listed here should just have its message shown.
 */
export const ErrorCode = {
	invalidLoginCode: 'INVALID_LOGIN_CODE_401',
	accountLocked: 'ACCOUNT_LOCKED_423',
	emailNotVerified: 'EMAIL_NOT_VERIFIED_403',
	accountInactive: 'ACCOUNT_INACTIVE_403',
	invalidRefreshToken: 'REFRESH_TOKEN_401',
	invalidVerificationToken: 'INVALID_VERIFICATION_TOKEN_400',
	notAuthenticated: 'USER_401',
	accessDenied: 'ACCESS_DENIED_403',
	rateLimited: 'RATE_LIMIT_429',
	csrfHeaderMissing: 'CSRF_403',
	validation: 'VALIDATION_ERROR',
} as const


const NETWORK_MESSAGE = 'Nie udało połączyć się z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie.'
const TIMEOUT_MESSAGE = 'Serwer nie odpowiedział na czas. Spróbuj ponownie za chwilę.'
const UNKNOWN_MESSAGE = 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.'


/** Shown both when a 401 carried no body and when a session ends on its own. */
export const SESSION_EXPIRED_MESSAGE = 'Twoja sesja wygasła. Zaloguj się ponownie.'

/** Never shown - an aborted request is something the application did, not something to report. */
const CANCELED_MESSAGE = 'Żądanie zostało anulowane.'


interface ApiErrorOptions {
	status?: number | null
	errorCode?: string | null
	retryAfterSeconds?: number | null
	isNetworkError?: boolean
	isCanceled?: boolean
}

/**
 * One error type for everything that comes back from the API.
 */
export class ApiError extends Error {
	readonly status: number | null
	readonly errorCode: string | null
	/** From the Retry-After header on a 429; how long until the rate limiter lets this through. */
	readonly retryAfterSeconds: number | null
	readonly isNetworkError: boolean
	/** The request was aborted deliberately - a query cancelled, a component gone. Not a failure. */
	readonly isCanceled: boolean

	constructor(message: string, options: ApiErrorOptions = {}) {
		super(message)

		this.name = 'ApiError'
		this.status = options.status ?? null
		this.errorCode = options.errorCode ?? null
		this.retryAfterSeconds = options.retryAfterSeconds ?? null
		this.isNetworkError = options.isNetworkError ?? false
		this.isCanceled = options.isCanceled ?? false
	}

	is(code: string): boolean {
		return this.errorCode === code
	}
}

/**
 * Normalizes anything thrown into an {@link ApiError}.
 */
export function toApiError(error: unknown): ApiError {
	if (error instanceof ApiError) {
		return error
	}

	if (!axios.isAxiosError(error)) {
		return new ApiError(error instanceof Error && error.message ? error.message : UNKNOWN_MESSAGE)
	}

	if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
		return new ApiError(CANCELED_MESSAGE, { isCanceled: true })
	}

	if (error.response) {
		const body = asBackendErrorBody(error.response.data)

		return new ApiError(body?.message ?? messageForStatus(error.response.status), {
			status: error.response.status,
			errorCode: body?.errorCode ?? null,
			retryAfterSeconds: readRetryAfter(error.response.headers),
		})
	}

	// No response at all: refused, aborted, blocked by CORS, or offline.
	const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'

	return new ApiError(timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE, { isNetworkError: true })
}

/**
 * Re-throws anything as an {@link ApiError}.
 * Meant for `.catch(rethrowAsApiError)` on the promise a query or mutation returns.
 */
export function rethrowAsApiError(error: unknown): never {
	throw toApiError(error)
}

/**
 * True when the failure is the caller's fault and repeating the identical request cannot help.
 */
export function isClientError(error: ApiError): boolean {
	return error.status !== null && error.status >= 400 && error.status < 500 && error.status !== 429
}


function asBackendErrorBody(data: unknown): BackendErrorBody | null {
	if (typeof data !== 'object' || data === null) {
		return null
	}

	const candidate = data as Partial<BackendErrorBody>

	return typeof candidate.message === 'string' && candidate.message.length > 0
		? (candidate as BackendErrorBody)
		: null
}


function readRetryAfter(headers: unknown): number | null {
	if (typeof headers !== 'object' || headers === null) {
		return null
	}

	const raw = (headers as Record<string, unknown>)['retry-after']
	const seconds = Number(raw)

	return Number.isFinite(seconds) && seconds >= 0 ? seconds : null
}


function messageForStatus(status: number): string {
	if (status === 401) {
		return SESSION_EXPIRED_MESSAGE
	}

	if (status === 403) {
		return 'Nie masz uprawnień do wykonania tej operacji.'
	}

	if (status === 404) {
		return 'Nie znaleziono.'
	}

	if (status === 429) {
		return 'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.'
	}

	if (status >= 500) {
		return 'Serwer napotkał problem. Spróbuj ponownie za chwilę.'
	}

	return UNKNOWN_MESSAGE
}
