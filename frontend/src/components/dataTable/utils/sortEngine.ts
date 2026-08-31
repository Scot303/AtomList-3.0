import { LOCALE } from '@/lib/locale';

import type { SortTag } from '../types/filterTypes';

/**
 * Everything custom sorting needs that a {@link FilterableColumn} cannot carry, because it is typed against the row.
 * Built once in `useDataTable`, where `T` is still known.
 */
export interface SortResolution<T> {
	/** Column id → a function producing the value to compare, when the raw cell value is not it. */
	sortValues: Map<string, (row: T) => unknown>;
	/** Column id → (option id → display name), so tag and select columns sort by label, not by id. */
	optionNames: Map<string, Map<string, string>>;
}

export function emptySortResolution<T>(): SortResolution<T> {
	return { sortValues: new Map(), optionNames: new Map() };
}

/**
 * Sorts a copy of `data` by each tag in turn, first tag wins ties last.
 *
 * Only runs while TanStack's own header sorting is idle - clicking a column header is treated as a
 * temporary override of the saved sort rather than something that merges with it.
 */
export function applyCustomSorts<T extends object>(data: T[], sortTags: SortTag[], resolution: SortResolution<T>): T[] {
	if (sortTags.length === 0) {
		return data;
	}

	const { sortValues, optionNames } = resolution;

	// Resolve each tag's accessors once instead of on every comparison.
	const plan = sortTags.map((tag) => ({
		direction: tag.direction,
		read: sortValues.get(tag.field) ?? ((row: T) => (row as Record<string, unknown>)[tag.field]),
		names: optionNames.get(tag.field),
	}));

	return [...data].sort((a, b) => {
		for (const { direction, read, names } of plan) {
			const rawA = read(a);
			const rawB = read(b);

			const valueA = names ? names.get(String(rawA ?? '')) ?? rawA : rawA;
			const valueB = names ? names.get(String(rawB ?? '')) ?? rawB : rawB;

			const comparison = compareValues(valueA, valueB);

			if (comparison !== 0) {
				return direction === 'asc' ? comparison : -comparison;
			}
		}

		return 0;
	});
}


const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

function isDateLike(value: unknown): value is Date | string {
	return value instanceof Date || (typeof value === 'string' && ISO_DATE.test(value));
}


/**
 * Locale collation, so under {@link LOCALE} 'ą' sorts next to 'a' rather than after 'z', and numeric
 * collation, so 'Something 2' comes before 'Something 10' instead of being compared digit by digit.
 */
const collator = new Intl.Collator(LOCALE, { numeric: true, sensitivity: 'variant' });


/** Blanks sort first ascending, so a column of mostly-empty values reads as a to-do list. */
function compareValues(a: unknown, b: unknown): number {
	if (a == null && b == null) {
		return 0;
	}
	if (a == null) {
		return -1;
	}
	if (b == null) {
		return 1;
	}

	if (typeof a === 'number' && typeof b === 'number') {
		return a - b;
	}

	if (typeof a === 'boolean' && typeof b === 'boolean') {
		return Number(a) - Number(b);
	}

	if (isDateLike(a) && isDateLike(b)) {
		const timeA = new Date(a).getTime();
		const timeB = new Date(b).getTime();

		if (!Number.isNaN(timeA) && !Number.isNaN(timeB)) {
			return timeA - timeB;
		}
	}

	return collator.compare(String(a), String(b));
}
