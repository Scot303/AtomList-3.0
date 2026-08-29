export const transactionKeys = {
	all: ['transactions'] as const,
	forList: (listId: string) => [...transactionKeys.all, 'list', listId] as const,
};
