import type { TagOption } from '@/components/ui/tags';
import type { TransactionType, TransactionView } from './types.ts';


export const INCOME_ID: TransactionType = 'INCOME';
export const EXPENSE_ID: TransactionType = 'EXPENSE';

export const TRANSACTION_TYPE_OPTIONS: TagOption[] = [
	{ id: INCOME_ID, name: 'Przychód', color: 'emerald' },
	{ id: EXPENSE_ID, name: 'Wydatek', color: 'red' },
];

export const TRANSACTION_TYPE_TITLES: Record<string, string> = {
	[INCOME_ID]: 'Pokaż tylko przychody',
	[EXPENSE_ID]: 'Pokaż tylko wydatki',
};


/* ── Row ─────────────────────────────────────────────────────────────────── */


export interface TransactionRow {
	id: string;
	/** `YYYY-MM-DD`, or `''`. */
	paymentDate: string;
	name: string;
	type: TransactionType;
	amount: number;
	quantity: number;
	total: number;
	invoiceNumber: string;
	note: string;
	transaction: TransactionView;
}


export function transactionName(transaction: TransactionView): string {
	const named = transaction.name.trim();

	return named === '' ? transaction.instructorName ?? '' : named;
}


export function toTransactionRow(transaction: TransactionView): TransactionRow {
	return {
		id: transaction.id,
		paymentDate: transaction.paymentDate ?? '',
		name: transactionName(transaction),
		type: transaction.type,
		amount: transaction.amount,
		quantity: transaction.quantity,
		total: transaction.total,
		invoiceNumber: transaction.invoiceNumber ?? '',
		note: transaction.note ?? '',
		transaction,
	};
}
