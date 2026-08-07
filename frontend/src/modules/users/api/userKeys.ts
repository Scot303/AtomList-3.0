/** Query keys for account administration. */
export const adminUserKeys = {
	all: ['admin-users'] as const,
	list: () => [...adminUserKeys.all, 'list'] as const,
};
