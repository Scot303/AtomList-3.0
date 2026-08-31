import { useEffect } from 'react';
import { type OnChangeFn, type RowSelectionState, type SortingState, type Table, useTable } from '@tanstack/react-table';
import type { AppColumnDef } from '@/components/dataTable';
import { dataTableFeatures, type DataTableFeatures } from '@/components/dataTable';
import type { TableLayout } from './useTableLayout';


interface TableInstanceInput<T extends object> {
	/** Already filtered, searched and sorted by {@link useTableData}. */
	data: T[];
	columns: AppColumnDef<T>[];
	layout: TableLayout;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	rowSelection: RowSelectionState;
	onRowSelectionChange: OnChangeFn<RowSelectionState>;
	getRowId: ( (row: T) => string ) | undefined;
	enableRowSelection: boolean;
	enableGrouping: boolean;
}


/**
 * Builds the TanStack table and settles the column widths a drag leaves behind.
 */
export function useTableInstance<T extends object>(input: TableInstanceInput<T>): Table<DataTableFeatures, T> {
	'use no memo';

	const {
		data, columns, layout, sorting, onSortingChange,
		rowSelection, onRowSelectionChange, getRowId,
		enableRowSelection, enableGrouping,
	} = input;

	const table = useTable<DataTableFeatures, T>({
		features: dataTableFeatures,
		data,
		columns,
		getRowId,
		state: {
			sorting,
			columnOrder: layout.columnOrder,
			columnVisibility: layout.columnVisibility,
			columnSizing: layout.columnSizing,
			grouping: layout.grouping,
			rowSelection,
		},
		columnResizeMode: 'onChange',
		enableColumnResizing: true,
		enableRowSelection,
		enableGrouping,
		groupedColumnMode: false,
		onSortingChange,
		onColumnOrderChange: layout.setColumnOrder,
		onColumnVisibilityChange: layout.setColumnVisibility,
		onColumnSizingChange: layout.onColumnSizingChange,
		onGroupingChange: layout.setGrouping,
		onRowSelectionChange,
	});

	/**
	 * The width the drag settled on, written down once the handle is released.
	 */
	const isResizingColumn = table.state.columnResizing.isResizingColumn !== false;
	const { draftColumnSizing, clearDraftColumnSizing, persistColumnSizing } = layout;

	useEffect(() => {
		if (draftColumnSizing === null || isResizingColumn) {
			return;
		}

		persistColumnSizing(draftColumnSizing);
		clearDraftColumnSizing();
	}, [draftColumnSizing, isResizingColumn, persistColumnSizing, clearDraftColumnSizing]);

	return table;
}
