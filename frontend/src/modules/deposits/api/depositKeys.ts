export const depositKeys = {
	all: ['deposits'] as const,
	history: (year: number | null) => [...depositKeys.all, 'history', year] as const,
	byId: (id: string) => [...depositKeys.all, 'detail', id] as const,
	byCode: (code: string) => [...depositKeys.all, 'by-code', code] as const,
	credit: (personId: string) => [...depositKeys.all, 'credit', personId] as const,
};
