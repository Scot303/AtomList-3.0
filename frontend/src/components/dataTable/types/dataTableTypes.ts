import type React from 'react';
import type { CellData, ColumnDef, ColumnVisibilityState } from '@tanstack/react-table';
import type { DataTableFeatures } from '../tableFeatures';
import type { FieldType } from './columnMeta';

export type { AppColumnMeta, FieldType } from './columnMeta';

/**
 * A column definition for this table.
 *
 * `fieldType` and `sortValue` sit alongside TanStack's own options rather than inside `meta`,
 * because both are read while building the filter and sort UI, before any column instance exists.
 */
export type AppColumnDef<T extends object, TValue extends CellData = CellData> =
	ColumnDef<DataTableFeatures, T, TValue>
	&
	{
		fieldType?: FieldType;
		/** The value custom sorting should compare when the raw cell value is not it. */
		sortValue?: (row: T) => unknown;
	};


export interface DataTableProps<T extends object> {
	data: T[];
	columns: AppColumnDef<T>[];
	/**
	 * Identifies this table's saved layout. Must be stable across releases and unique per table -
	 * two tables sharing a key share their column order, widths, and filters.
	 */
	moduleKey: string;
	/** Enables in-place editing on columns whose `meta.editable` is set. */
	onCellEdit?: (rowId: string, columnId: string, value: unknown) => void;
	isLoading?: boolean;
	enableRowSelection?: boolean;
	enableGrouping?: boolean;
	/** Rendered at the left of the toolbar, before the search box. */
	toolbarStart?: React.ReactNode;
	/** Rendered at the right of the search box. */
	toolbar?: React.ReactNode;
	onRowClick?: (row: T) => void;
	onRowContextMenu?: (event: React.MouseEvent, row: T) => void;
	emptyMessage?: string;
	getRowId?: (row: T) => string;
	/** Applied only when this table has no saved layout for the current user. */
	initialColumnVisibility?: ColumnVisibilityState;
	/** Most simple filter tags at once. Advanced filters are capped separately, at one. */
	maxFilterTags?: number;
	/** Most rules inside the single advanced filter. */
	maxAdvancedRules?: number;
}
