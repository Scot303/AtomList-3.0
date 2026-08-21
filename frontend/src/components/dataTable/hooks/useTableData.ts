import { type ReactNode, useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { formatLongDate } from '@/utils/dateUtils.ts';
import type { AppColumnDef } from '@/components/dataTable';
import type { FilterActiveTag, SortTag } from '../types/filterTypes';
import { resolveColumnId } from '../utils/columnIds';
import { applyFilterTags } from '../utils/filterEngine';
import { applyGlobalSearch, holdsSearchableText, type SearchField } from '../utils/searchEngine';
import { applyCustomSorts, type SortResolution } from '../utils/sortEngine';


interface TableDataInput<T extends object> {
	data: T[];
	columns: AppColumnDef<T>[];
	filterTags: FilterActiveTag[];
	sortTags: SortTag[];
	globalFilter: string;
	/** The header-click sort, which overrides the saved one while it is set. */
	sorting: SortingState;
	isVisible: (columnId: string) => boolean;
}


/**
 * Filters, searches and sorts the rows before they reach the table.
 */
export function useTableData<T extends object>(input: TableDataInput<T>): T[] {
	const { data, columns, filterTags, sortTags, globalFilter, sorting, isVisible } = input;

	/**
	 * How each column's values should be compared, resolved where the row type is still known.
	 * Tag and select columns sort by their option's label rather than by its id.
	 */
	const sortResolution = useMemo<SortResolution<T>>(() => {
		const sortValues = new Map<string, (row: T) => unknown>();
		const optionNames = new Map<string, Map<string, string>>();

		for (const column of columns) {
			const id = resolveColumnId(column);
			if (id === undefined) {
				continue;
			}

			if (column.sortValue) {
				sortValues.set(id, column.sortValue);
			}

			const options = column.meta?.tagOptions ?? column.meta?.selectOptions;
			if (options?.length) {
				optionNames.set(id, new Map(options.map((option) => [String(option.id), option.name])));
			}
		}

		return { sortValues, optionNames };
	}, [columns]);

	/**
	 * The columns the global search box scans, and how each of them reads.
	 * Hidden columns are never scanned.
	 */
	const searchFields = useMemo<SearchField<T>[]>(() => {
		const fields: SearchField<T>[] = [];

		for (const column of columns) {
			const id = resolveColumnId(column);

			if (id === undefined || !isVisible(id) || column.meta?.globalSearch === false) {
				continue;
			}

			const read = sortResolution.sortValues.get(id) ?? ( (row: T) => ( row as Record<string, unknown> )[id] );

			if (column.meta?.globalSearch !== true && !holdsSearchableText(data, read)) {
				continue;
			}

			fields.push({ read, names: sortResolution.optionNames.get(id), format: searchFormat(column) });
		}

		return fields;
	}, [columns, isVisible, sortResolution, data]);

	/**
	 * Filter tags stay applied whether or not the filter bar is on screen.
	 */
	return useMemo<T[]>(() => {
		const filtered = filterTags.length > 0 ? applyFilterTags(data, filterTags) : data;
		const searched = applyGlobalSearch(filtered, globalFilter, searchFields);

		// Clicking a column header is a temporary override of the saved sort, not an addition to it.
		return sorting.length === 0 ? applyCustomSorts(searched, sortTags, sortResolution) : searched;
	}, [data, filterTags, globalFilter, searchFields, sortTags, sorting, sortResolution]);
}


/**
 * The text a column offers the search box beyond its stored value.
 */
function searchFormat<T extends object>(column: AppColumnDef<T>): ( (value: unknown) => ReactNode ) | undefined {
	if (column.meta?.searchText) {
		return column.meta.searchText;
	}

	if (column.meta?.displayFormatter) {
		return column.meta.displayFormatter;
	}

	return column.fieldType === 'date' ? (value) => formatLongDate(String(value ?? '')) : undefined;
}
