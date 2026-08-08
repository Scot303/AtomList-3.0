/**
 * A note to ourselves that this browser probably holds a refresh cookie.
 *
 * The cookie itself is HttpOnly, so no script can see whether it exists. Without a hint every
 * first-time visitor would have their startup blocked on a /refresh call that was always going to
 * be a 401 - a wasted round trip on the sign-in page and a wasted slot in the rate limiter's
 * per-IP bucket for that path.
 *
 * It is only ever a hint. It holds no token and grants nothing; the worst a tampered value can
 * achieve is one pointless refresh attempt, or a sign-in page shown to somebody who could have been
 * let straight in.
 */

const STORAGE_KEY = 'atomlist.session-hint';

/**
 * Matches app.security.refresh-token-ttl (REFRESH_TOKEN_TTL, 10d). Past this point the cookie is
 * certainly dead, so there is nothing left to try.
 */
const HINT_TTL_MS = 10 * 24 * 60 * 60 * 1000;

export function markSessionHint(): void {
	write(String(Date.now() + HINT_TTL_MS));
}

export function clearSessionHint(): void {
	write(null);
}

export function hasSessionHint(): boolean {
	const raw = read();

	if (raw === null) {
		return false;
	}

	const expiresAt = Number(raw);

	if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
		clearSessionHint();

		return false;
	}

	return true;
}

function read(): string | null {
	try {
		return window.localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

function write(value: string | null): void {
	try {
		if (value === null) {
			window.localStorage.removeItem(STORAGE_KEY);
		} else {
			window.localStorage.setItem(STORAGE_KEY, value);
		}
	} catch {
		// Storage can be unavailable or full (private browsing, quota, storage disabled).
	}
}
