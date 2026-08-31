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
import type { AppColumnMeta } from '../types/columnMeta';


/**
 * The feature set every `DataTable` runs on.
 */
export const dataTableFeatures = tableFeatures({
	columnOrderingFeature,
	columnVisibilityFeature,
	columnSizingFeature,
	columnResizingFeature,
	columnFilteringFeature,
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		text: sortFn_text,
		datetime: sortFn_datetime,
		basic: sortFn_basic,
	},
	filteredRowModel: createFilteredRowModel(),
	rowAggregationFeature,
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
