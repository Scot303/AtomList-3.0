/**
 * Mirror of the backend's `TransactionType`
 *
 * The two are read and written under permissions of their own.
 */
export type TransactionType = 'INCOME' | 'EXPENSE';


/**
 * Mirror of the backend's `TransactionView`.
 */
export interface TransactionView {
	id: string;
	listId: string;
	/** On an instructor row, the label the seeding wrote from their name. Editable afterwards. */
	name: string;
	type: TransactionType;
	/** The unit price. On an instructor row, their hourly rate. */
	amount: number;
	/** On an instructor row, the hours they worked that month. */
	quantity: number;
	/** `amount * quantity`, as the backend worked it out. */
	total: number;
	invoiceNumber: string | null;
	/** `YYYY-MM-DD`, or null on a row whose date nobody has filled in yet. */
	paymentDate: string | null;
	/** Set only on an expense row that pays an instructor, which is where its name comes from. */
	instructorId: string | null;
	instructorName: string | null;
	note: string | null;
}


/** POST /api/lists/{listId}/transactions */
export interface CreateTransactionPayload {
	name: string;
	type: TransactionType;
	amount: number;
	quantity: number;
	invoiceNumber?: string;
	paymentDate?: string;
	instructorId?: string;
	note?: string;
}


/**
 * PATCH /api/transactions/{id}. Every field is optional: one left out is left alone.
 */
export interface UpdateTransactionPayload {
	name?: string;
	amount?: number;
	quantity?: number;
	invoiceNumber?: string;
	paymentDate?: string;
	note?: string;
}
