export const personKeys = {
	all: ['persons'] as const,
	list: () => [...personKeys.all, 'list'] as const,
	memberships: (personId: string) => [...personKeys.all, 'memberships', personId] as const,
	discounts: () => [...personKeys.all, 'discounts'] as const,
	discount: (personId: string) => [...personKeys.discounts(), personId] as const,
	arrears: (personId: string) => [...personKeys.all, 'arrears', personId] as const,
};

export const familyKeys = {
	all: ['families'] as const,
	list: () => [...familyKeys.all, 'list'] as const,
};
