import { useMemo, useState } from 'react';
import type { RowSelectionState, SortingState } from '@tanstack/react-table';
import type { DataTableProps } from '@/components/dataTable';
import { useColumnReorder } from './useColumnReorder';
import { useColumnViews } from './useColumnViews';
import { useContextRow } from './useContextRow';
import { useTableData } from './useTableData';
import { useTableInstance } from './useTableInstance';
import { useTableLayout } from './useTableLayout';
import { useTableViewport } from './useTableViewport';


export const useDataTable = <T extends object>(props: DataTableProps<T>) => {
	const {
		data,
		columns,
		moduleKey,
		onCellEdit,
		isLoading = false,
		enableRowSelection = false,
		enableGrouping = false,
		toolbarStart,
		toolbar,
		onRowClick,
		onRowContextMenu,
		emptyMessage,
		getRowId,
		initialColumnVisibility,
		maxFilterTags,
		maxAdvancedRules,
	} = props;

	const layout = useTableLayout(moduleKey, columns, initialColumnVisibility);

	/* State that is deliberately not remembered between visits. */
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const { contextRowId, setContextRowId } = useContextRow();

	const processedData = useTableData({
		data,
		columns,
		filterTags: layout.filterTags,
		sortTags: layout.sortTags,
		globalFilter,
		sorting,
		isVisible: layout.isVisible,
	});

	const rowId = useMemo(
		() => ( getRowId ? (row: T) => getRowId(row) : undefined ),
		[getRowId],
	);

	const table = useTableInstance({
		data: processedData,
		columns,
		layout,
		sorting,
		onSortingChange: setSorting,
		rowSelection,
		onRowSelectionChange: setRowSelection,
		getRowId: rowId,
		enableRowSelection,
		enableGrouping,
	});

	const { filterableColumns, visibilityColumns, groupableColumns, headerGroups, orderedColumnIds, totalWidth } = useColumnViews(table, layout.isVisible);

	const { sensors, handleDragEnd } = useColumnReorder(layout.columnOrder, layout.setColumnOrder);

	const {
		scrollRef, headRef, popoverClip, bodyRows, renderRows, paddingTop, paddingBottom, measureRow, filteredRowCount,
	} = useTableViewport(table, {
		filterTags: layout.filterTags,
		sortTags: layout.sortTags,
		globalFilter,
		sorting,
	});

	return {
		globalFilter, setGlobalFilter,
		showFilters: layout.showFilters, toggleFilters: layout.toggleFilters,
		filterTags: layout.filterTags, setFilterTags: layout.setFilterTags,
		sortTags: layout.sortTags, setSortTags: layout.setSortTags,
		grouping: layout.grouping, setGrouping: layout.setGrouping,
		filterableColumns, visibilityColumns, groupableColumns,
		enableGrouping, toolbarStart, toolbar,
		onCellEdit, onRowClick, onRowContextMenu,
		contextRowId, setContextRowId,
		emptyMessage, isLoading,
		sensors, handleDragEnd,
		orderedColumnIds, headerGroups,
		totalWidth, bodyRows,
		scrollRef, headRef, popoverClip,
		renderRows, paddingTop, paddingBottom, measureRow,
		filteredRowCount,
		totalRowCount: data.length,
		resetLayout: layout.reset,
		maxFilterTags, maxAdvancedRules,
	};
};
