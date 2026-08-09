import {
	aggregationFn_extent,
	aggregationFn_sum,
	columnFilteringFeature,
	columnGroupingFeature,
	columnOrderingFeature,
	columnResizingFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	createExpandedRowModel,
	createFilteredRowModel,
	createGroupedRowModel,
	createSortedRowModel,
	rowAggregationFeature,
	rowExpandingFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_basic,
	sortFn_datetime,
	sortFn_text,
	tableFeatures,
} from '@tanstack/react-table';
import type { AppColumnMeta } from './types/columnMeta';

/**
 * The feature set every `DataTable` runs on.
 *
 * `globalFilteringFeature` is deliberately absent: the toolbar's search box is applied by
 * {@link applyGlobalSearch} before the data reaches the table, so that it can be scoped to the visible
 * columns and match tag and select values by label.
 */
export const dataTableFeatures = tableFeatures({
	columnOrderingFeature,
	columnVisibilityFeature,
	columnSizingFeature,
	columnResizingFeature,
	columnFilteringFeature,
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	/** The comparators a column may be sorted by. */
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		text: sortFn_text,
		datetime: sortFn_datetime,
		basic: sortFn_basic,
	},
	filteredRowModel: createFilteredRowModel(),
	rowAggregationFeature,
	/** How a grouped row summarises the rows under it. */
	aggregationFns: {
		sum: aggregationFn_sum,
		extent: aggregationFn_extent,
	},
	columnGroupingFeature,
	groupedRowModel: createGroupedRowModel(),
	rowExpandingFeature,
	expandedRowModel: createExpandedRowModel(),
	rowSelectionFeature,
	columnMeta: {} as AppColumnMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;
