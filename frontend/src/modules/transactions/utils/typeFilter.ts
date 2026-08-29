import type { TableFilterTagsBinding } from '@/components/dataTable';
import { EXPENSE_ID, INCOME_ID } from '../types/transactionRows.ts';
import type { TransactionType } from '../types/types.ts';


export const TYPE_FILTER_ID = 'transactions-quick-type';
export const TYPE_FIELD = 'type';


export function shownTransactionType(tags: TableFilterTagsBinding): TransactionType | undefined {
	const tag = tags.filterTags.find((candidate) => candidate.id === TYPE_FILTER_ID);

	if (tag === undefined || tag.mode !== 'simple') {
		return undefined;
	}

	return tag.values.find((value): value is TransactionType => value === INCOME_ID || value === EXPENSE_ID);
}
