export const instructorKeys = {
	all: ['instructors'] as const,
	list: () => [...instructorKeys.all, 'list'] as const,
};
