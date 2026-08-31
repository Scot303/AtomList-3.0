import type { TableFilterTagsBinding } from '@/components/dataTable';
import type { TagOption, TagRecord } from '@/components/ui/tags';
import { tagOptions } from '@/components/ui/tags';
import { EXPENSE_ID, INCOME_ID } from '../types/transactionRows.ts';
import type { TransactionType } from '../types/types.ts';


export const TYPE_FILTER_ID = 'transactions-quick-type';
export const TYPE_FIELD = 'type';

/** The same two types the table colors, named in the plural because a filter chip reads as a heading. */
export const TYPE_FILTER_TAGS: TagRecord<TransactionType> = {
	[INCOME_ID]: { id: INCOME_ID, name: 'Przychody', color: 'emerald' },
	[EXPENSE_ID]: { id: EXPENSE_ID, name: 'Wydatki', color: 'red' },
};

export const TYPE_FILTER_OPTIONS: TagOption[] = tagOptions(TYPE_FILTER_TAGS);


export function shownTransactionType(tags: TableFilterTagsBinding): TransactionType | undefined {
	const tag = tags.filterTags.find((candidate) => candidate.id === TYPE_FILTER_ID);

	if (tag === undefined || tag.mode !== 'simple') {
		return undefined;
	}

	return tag.values.find((value): value is TransactionType => value === INCOME_ID || value === EXPENSE_ID);
}
