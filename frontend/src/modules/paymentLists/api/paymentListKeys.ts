export const paymentListKeys = {
	all: ['payment-lists'] as const,
	custom: () => [...paymentListKeys.all, 'custom'] as const,
	byId: (id: string) => [...paymentListKeys.all, 'detail', id] as const,
	seasonSummary: (startYear: number) => [...paymentListKeys.all, 'summary', startYear] as const,
	report: (listId: string) => [...paymentListKeys.all, 'report', listId] as const,
	payments: (listId: string) => [...paymentListKeys.all, 'payments', listId] as const,
	payment: (id: string) => [...paymentListKeys.all, 'payment', id] as const,
	overpayments: (listId: string) => [...paymentListKeys.all, 'overpayments', listId] as const,
	arrears: (personId: string) => [...paymentListKeys.all, 'arrears', personId] as const,
};
