export const paymentListKeys = {
	all: ['payment-lists'] as const,
	list: () => [...paymentListKeys.all, 'list'] as const,
	byId: (id: string) => [...paymentListKeys.all, 'detail', id] as const,
	yearSummary: (year: number) => [...paymentListKeys.all, 'summary', year] as const,
	report: (listId: string) => [...paymentListKeys.all, 'report', listId] as const,
	payments: (listId: string) => [...paymentListKeys.all, 'payments', listId] as const,
	payment: (id: string) => [...paymentListKeys.all, 'payment', id] as const,
	overpayments: (listId: string) => [...paymentListKeys.all, 'overpayments', listId] as const,
};
