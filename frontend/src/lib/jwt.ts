/**
 * Reads the expiry out of an access token so the session can be renewed a little before it lapses rather than after a request has already failed.
 */
export function readAccessTokenExpiry(token: string): number | null {
	const payload = decodePayload(token);

	if (payload === null || typeof payload.exp !== 'number') {
		return null;
	}

	return payload.exp * 1000;
}

function decodePayload(token: string): Record<string, unknown> | null {
	const segments = token.split('.');

	if (segments.length !== 3) {
		return null;
	}

	try {
		const json = atob(base64UrlToBase64(segments[1]));
		const parsed: unknown = JSON.parse(json);

		return typeof parsed === 'object' && parsed !== null
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

function base64UrlToBase64(segment: string): string {
	const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
	const paddingNeeded = (4 - (base64.length % 4)) % 4;

	return base64 + '='.repeat(paddingNeeded);
}
