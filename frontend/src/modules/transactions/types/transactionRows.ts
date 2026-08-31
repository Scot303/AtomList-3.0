import type { TagOption, TagRecord } from '@/components/ui/tags';
import { tagOptions } from '@/components/ui/tags';
import type { TransactionType, TransactionView } from './types.ts';


/** Left unannotated so each is its own literal type, which is what keys a {@link TagRecord}. */
export const INCOME_ID = 'INCOME';
export const EXPENSE_ID = 'EXPENSE';

export const TRANSACTION_TYPE_TAGS: TagRecord<TransactionType> = {
	[INCOME_ID]: { id: INCOME_ID, name: 'Przychód', color: 'emerald' },
	[EXPENSE_ID]: { id: EXPENSE_ID, name: 'Wydatek', color: 'red' },
};

export const TRANSACTION_TYPE_OPTIONS: TagOption[] = tagOptions(TRANSACTION_TYPE_TAGS);

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
