import type React from 'react';
import type { Cell, CellData, ColumnDef, ColumnVisibilityState, Row, SortDirection } from '@tanstack/react-table';
import type { DataTableFeatures } from '@/components/dataTable';
import type { FieldType } from './columnMeta';


export type { AppColumnMeta, FieldType } from './columnMeta';

/**
 * A column definition for this table.
 */
export type AppColumnDef<T extends object, TValue extends CellData = CellData> =
	ColumnDef<DataTableFeatures, T, TValue>
	&
	{
		fieldType?: FieldType;
		/** The value custom sorting should compare when the raw cell value is not it. */
		sortValue?: (row: T) => unknown;
	};


/**
 * One header cell, with everything it draws resolved off the table up front.
 */
export interface RenderHeader {
	id: string;
	columnId: string;
	/** The column's own label, for the resize handle's accessible name. */
	label: string;
	/** Already rendered, so the cell never touches `flexRender` or a header context itself. */
	content: React.ReactNode;
	size: number;
	sorted: SortDirection | false;
	canSort: boolean;
	canResize: boolean;
	isResizing: boolean;
	/** Undefined when the column cannot be sorted. */
	onToggleSort: ( (event: unknown) => void ) | undefined;
	onResizeStart: (event: unknown) => void;
	onResizeStep: (delta: number) => void;
}


export interface RenderHeaderGroup {
	id: string;
	headers: RenderHeader[];
}


/**
 * One row of the drawn window, with everything the row components read off the table resolved up front.
 *
 * `cells` doubles as each row's invalidation signal. TanStack memoises it per row against the column objects, so
 * it moves whenever a column is hidden, reordered, grouped, or rebuilt - the last of which is what lets `memo` on
 * a row through when a cell renderer closes over data that was still in flight on the first paint.
 */
export interface RenderRow<T extends object> {
	row: Row<DataTableFeatures, T>;
	cells: Cell<DataTableFeatures, T>[];
	/** Place in the full dataset, which the row's position in the DOM no longer gives away because only a window of rows is mounted. */
	index: number;
	isGrouped: boolean;
}


export interface DataTableProps<T extends object> {
	data: T[];
	columns: AppColumnDef<T>[];
	/** Identifies this table's saved layout. Must be stable across releases and unique per table. */
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
