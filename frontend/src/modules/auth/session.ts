import { connectAuth } from '@/api/authBridge';
import { AUTH_ENDPOINTS } from '@/api/endpoints';
import { ApiError, toApiError } from '@/api/errors';
import { refreshClient } from '@/api/refreshClient';
import { createBroadcast, withCrossTabLock } from '@/lib/crossTab';
import { readAccessTokenExpiry } from '@/lib/jwt';
import type { TokenResponse } from '@/types/auth';

import { clearSessionHint, hasSessionHint, markSessionHint } from './sessionHint';
import { useAuthStore } from './stores/authStore';

/**
 * Owns the access token for the whole application: how it is obtained, when it is renewed, and what happens when it can no longer be.
 */

/** Renew this long before the token actually lapses, so in-flight requests are never caught out. */
const RENEWAL_MARGIN_MS = 60_000;

/** Never schedule a renewal closer than this, so a clock skew cannot spin the timer. */
const MIN_RENEWAL_DELAY_MS = 5_000;

const REFRESH_LOCK = 'atomlist.auth.refresh';

export type SessionEndReason =
/** The refresh cookie is gone, expired, or was rejected. */
	| 'expired'
	/** The user asked to be signed out. */
	| 'signed-out';

type CrossTabMessage =
	| { type: 'session-started'; token: string }
	| { type: 'session-ended'; reason: SessionEndReason };

const channel = createBroadcast<CrossTabMessage>('atomlist.auth');

let renewalTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<string> | null = null;
let bootstrapInFlight: Promise<boolean> | null = null;

const sessionStartedListeners = new Set<(token: string) => void>();
const sessionEndedListeners = new Set<(reason: SessionEndReason) => void>();

/* -------------------------------------------------------------------------------------------- */
/* Reading                                                                                        */
/* -------------------------------------------------------------------------------------------- */

export function getAccessToken(): string | null {
	return useAuthStore.getState().accessToken;
}

function isExpiringSoon(token: string): boolean {
	const expiry = readAccessTokenExpiry(token);

	// A token we cannot read the expiry of is treated as due for renewal rather than trusted.
	return expiry === null || expiry - Date.now() <= RENEWAL_MARGIN_MS;
}

/* -------------------------------------------------------------------------------------------- */
/* Starting and ending                                                                            */
/* -------------------------------------------------------------------------------------------- */

/**
 * Adopts a freshly issued token. Called after signing in and after every renewal.
 */
export function startSession(token: string): void {
	adoptToken(token);
	markSessionHint();

	// Other tabs take the token as their own, which both keeps them signed in and saves them spending the refresh cookie again a moment later.
	channel.post({ type: 'session-started', token });
}

function adoptToken(token: string): void {
	useAuthStore.getState().setAccessToken(token);
	scheduleRenewal(token);
	sessionStartedListeners.forEach((listener) => listener(token));
}

/**
 * Drops everything this tab holds and tells the others to do the same.
 *
 * Safe to call repeatedly; a second call on an already-ended session does nothing observable.
 */
export function endSession(reason: SessionEndReason, options: { broadcast?: boolean } = {}): void {
	cancelRenewal();
	refreshInFlight = null;
	bootstrapInFlight = null;

	useAuthStore.getState().clear();
	clearSessionHint();

	if (options.broadcast !== false) {
		channel.post({ type: 'session-ended', reason });
	}

	sessionEndedListeners.forEach((listener) => listener(reason));
}

/**
 * Ends the session on the server too, so the refresh token is revoked rather than left alive until it expires on its own.
 */
export async function signOut(): Promise<void> {
	try {
		await refreshClient.post(AUTH_ENDPOINTS.logout);
	} catch {
	} finally {
		endSession('signed-out');
	}
}

/* -------------------------------------------------------------------------------------------- */
/* Renewal                                                                                        */
/* -------------------------------------------------------------------------------------------- */

/**
 * Exchanges the refresh cookie for a new access token.
 *
 * Concurrent callers share one request, and tabs take turns, so the cookie is only ever spent once
 * per rotation. Throws an {@link ApiError} if the session could not be renewed; on a rejected
 * session (401/403) it has already ended the session before throwing.
 */
export function refreshAccessToken(): Promise<string> {
	refreshInFlight ??= runRefresh().finally(() => {
		refreshInFlight = null;
	});

	return refreshInFlight;
}

function runRefresh(): Promise<string> {
	return withCrossTabLock(REFRESH_LOCK, async () => {
		// Another tab may have refreshed while we queued for the lock and handed us its token.
		const current = getAccessToken();

		if (current !== null && !isExpiringSoon(current)) {
			return current;
		}

		try {
			const { data } = await refreshClient.post<TokenResponse>(AUTH_ENDPOINTS.refresh);

			startSession(data.token);

			return data.token;
		} catch (error) {
			const apiError = toApiError(error);

			if (apiError.status === 401 || apiError.status === 403) {
				endSession('expired');
			}

			throw apiError;
		}
	});
}

function scheduleRenewal(token: string): void {
	cancelRenewal();

	const expiry = readAccessTokenExpiry(token);

	if (expiry === null) {
		return;
	}

	const delay = Math.max(expiry - Date.now() - RENEWAL_MARGIN_MS, MIN_RENEWAL_DELAY_MS);

	renewalTimer = setTimeout(() => {
		void refreshAccessToken().catch(() => undefined);
	}, delay);
}

function cancelRenewal(): void {
	if (renewalTimer !== null) {
		clearTimeout(renewalTimer);
		renewalTimer = null;
	}
}

/* -------------------------------------------------------------------------------------------- */
/* Startup                                                                                        */
/* -------------------------------------------------------------------------------------------- */

/**
 * Re-establishes a session on page load, since the access token was only ever in memory.
 *
 * Resolves true when this browser turned out to hold a live refresh cookie.
 * Never throws - a failure here just means "not signed in".
 */
export function bootstrapSession(): Promise<boolean> {
	bootstrapInFlight ??= runBootstrap();

	return bootstrapInFlight;
}

async function runBootstrap(): Promise<boolean> {
	if (!hasSessionHint()) {
		return false;
	}

	try {
		await refreshAccessToken();

		return true;
	} catch (error) {
		const apiError = error instanceof ApiError ? error : toApiError(error);

		if (apiError.isNetworkError || apiError.status === 429 || (apiError.status ?? 0) >= 500) {
			console.warn('Could not verify the session on startup:', apiError.message);
		}

		return false;
	}
}

/* -------------------------------------------------------------------------------------------- */
/* Wiring                                                                                         */
/* -------------------------------------------------------------------------------------------- */

/**
 * Gives the API client the four things its interceptors need from auth.
 *
 * Called once from main.tsx rather than from a provider's effect: a child's effect runs before its
 * parent's, so a query fired on mount could otherwise leave before the token was reachable. Doing
 * it at the composition root means the client is never half-wired.
 */
export function installAuthBridge(): void {
	connectAuth({
		getAccessToken,

		// Worth trying without a token in hand: on a fresh load the token has not been minted yet,
		// but the refresh cookie the hint stands for may well still be good.
		canRenewSession: () => getAccessToken() !== null || hasSessionHint(),

		renewSession: refreshAccessToken,

		endSession: () => endSession('expired'),
	});
}

/**
 * Keeps this tab in step with the others and with the clock. Called once by the auth provider;
 * returns the teardown.
 */
export function watchSession(): () => void {
	const unsubscribeChannel = channel.subscribe((message) => {
		if (message.type === 'session-started') {
			// Adopt, but do not re-broadcast, or two tabs would echo at each other indefinitely.
			adoptToken(message.token);
			markSessionHint();

			return;
		}

		endSession(message.reason, { broadcast: false });
	});

	// Timers in a background tab are throttled hard, so a laptop that slept through the renewal
	// comes back holding a token that has already lapsed. Catch that on the way in rather than
	// letting the user's first click fail.
	const onVisible = () => {
		if (document.visibilityState !== 'visible') {
			return;
		}

		const token = getAccessToken();

		if (token !== null && isExpiringSoon(token)) {
			void refreshAccessToken().catch(() => undefined);
		}
	};

	document.addEventListener('visibilitychange', onVisible);

	return () => {
		unsubscribeChannel();
		document.removeEventListener('visibilitychange', onVisible);
	};
}

export function onSessionStarted(listener: (token: string) => void): () => void {
	sessionStartedListeners.add(listener);

	return () => sessionStartedListeners.delete(listener);
}

export function onSessionEnded(listener: (reason: SessionEndReason) => void): () => void {
	sessionEndedListeners.add(listener);

	return () => sessionEndedListeners.delete(listener);
}
