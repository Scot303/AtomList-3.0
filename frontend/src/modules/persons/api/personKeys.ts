export const personKeys = {
	all: ['persons'] as const,
	list: () => [...personKeys.all, 'list'] as const,
	memberships: (personId: string) => [...personKeys.all, 'memberships', personId] as const,
	discounts: (personId: string) => [...personKeys.all, 'discounts', personId] as const,
};

export const groupKeys = {
	all: ['groups'] as const,
	list: () => [...groupKeys.all, 'list'] as const,
};

export const familyKeys = {
	all: ['families'] as const,
	list: () => [...familyKeys.all, 'list'] as const,
};
