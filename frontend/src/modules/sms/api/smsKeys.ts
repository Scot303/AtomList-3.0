export const smsKeys = {
	all: ['sms'] as const,
	list: () => [...smsKeys.all, 'list'] as const,
};
