import type { TagOption } from '@/components/ui/tags';


/** Mirror of the backend's `PaymentMethod`. */
export type PaymentMethod = 'TRANSFER' | 'CASH' | 'BLIK';

export const PAYMENT_METHOD_OPTIONS: TagOption[] = [
	{ id: 'TRANSFER', name: 'Przelew', color: 'blue' },
	{ id: 'CASH', name: 'Gotówka', color: 'emerald' },
	{ id: 'BLIK', name: 'BLIK', color: 'violet' },
];

export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
	TRANSFER: 'Przelew',
	CASH: 'Gotówka',
	BLIK: 'BLIK',
};
