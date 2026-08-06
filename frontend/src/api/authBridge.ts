export interface AuthBridge {
	/** The token to attach, or null when nobody is signed in. */
	getAccessToken: () => string | null;
	/** Whether renewing is worth attempting at all - false on a page with no session behind it. */
	canRenewSession: () => boolean;
	/** Renews the access token. Rejects when the session could not be renewed. */
	renewSession: () => Promise<unknown>;
	/** Drops the session. */
	endSession: () => void;
}

/**
 * Until something connects, requests go out unauthenticated and no 401 is ever retried.
 */
const NOT_CONNECTED: AuthBridge = {
	getAccessToken: () => null,
	canRenewSession: () => false,
	renewSession: () => Promise.reject(new Error('No auth bridge has been connected.')),
	endSession: () => undefined,
};

let bridge: AuthBridge = NOT_CONNECTED;

export function connectAuth(implementation: AuthBridge): void {
	bridge = implementation;
}

export function getAccessToken(): string | null {
	return bridge.getAccessToken();
}

export function canRenewSession(): boolean {
	return bridge.canRenewSession();
}

export function renewSession(): Promise<unknown> {
	return bridge.renewSession();
}

export function endSession(): void {
	bridge.endSession();
}
