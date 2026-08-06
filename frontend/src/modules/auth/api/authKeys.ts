/** Query keys for everything auth-related, so a sign-out can drop the lot by prefix. */
export const authKeys = {
	all: ['auth'] as const,
	me: () => [...authKeys.all, 'me'] as const,
};
