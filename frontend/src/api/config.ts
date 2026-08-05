/** Origin of the backend, without a trailing slash. Inlined at build time - see .env.example. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/** CookieAuthCsrfFilter rejects the two cookie-authenticated endpoints (/refresh and /logout) unless this header is present. */
export const CSRF_HEADER = 'X-Auth-Request'

/** The backend translates its error messages from Accept-Language and defaults to Polish. */
export const API_LANGUAGE = 'pl'

/** Nothing here should hang for longer than this. */
export const REQUEST_TIMEOUT_MS = 20_000
