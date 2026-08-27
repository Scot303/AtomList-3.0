export const paths = {
	login: '/login',
	verifyEmail: '/verify-email',
	paymentLists: '/listy-platnosci',
	paymentListDetail: '/listy-platnosci/:listId',
	deposits: '/wplaty',
	users: '/uzytkownicy',
	persons: '/osoby',
	groups: '/grupy',
	sms: '/wiadomosci',
} as const;


export function paymentListDetailPath(listId: string): string {
	return `${ paths.paymentLists }/${ listId }`;
}


/**
 * Where a signed-in user lands when they have not asked for anywhere in particular.
 */
export const DEFAULT_AUTHENTICATED_PATH = paths.paymentLists;


/**
 * Accepts a remembered location only if it points back into this application.
 */
export function safeInternalPath(candidate: unknown): string | null {
	if (typeof candidate !== 'string' || candidate.length === 0) {
		return null;
	}

	if (!candidate.startsWith('/')) {
		return null;
	}

	if (candidate.startsWith('//') || candidate.startsWith('/\\')) {
		return null;
	}

	return candidate;
}
