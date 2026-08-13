export const groupKeys = {
	all: ['groups'] as const,
	list: () => [...groupKeys.all, 'list'] as const,
};
