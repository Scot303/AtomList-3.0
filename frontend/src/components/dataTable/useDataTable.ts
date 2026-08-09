import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	type Column,
	type ColumnOrderState,
	type ColumnSizingState,
	type ColumnVisibilityState,
	functionalUpdate,
	type GroupingState,
	type OnChangeFn,
	type RowSelectionState,
	type SortingState,
	useTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { PopoverClip } from '@/hooks/usePopoverClip';
import type { FilterableColumn } from './types/filterTypes';
import type { AppColumnDef, DataTableProps } from './types/dataTableTypes';
import { dataTableFeatures, type DataTableFeatures } from './tableFeatures';
import { applyFilterTags } from './utils/filterEngine';
import { applyGlobalSearch, holdsSearchableText, type SearchField } from './utils/searchEngine';
import { applyCustomSorts, type SortResolution } from './utils/sortEngine';
import { reconcileColumnOrder, useTablePrefs } from './useTablePrefs';


/* Stable fallbacks: a fresh literal per render would re-identify table state every render. */
const NO_COLUMN_ORDER: ColumnOrderState = [];
const NO_COLUMN_SIZING: ColumnSizingState = {};
const NO_GROUPING: GroupingState = [];
const NO_FILTER_TAGS: never[] = [];
const NO_SORT_TAGS: never[] = [];

/**
 * Height a row is assumed to have before it has been measured. Only shows up in the scrollbar's length on the first paint.
 * `measureElement` replaces it with each row's real height.
 */
const ESTIMATED_ROW_HEIGHT = 45;

/** Rows kept mounted either side of the window, so a fast scroll does not outrun the render. */
const ROW_OVERSCAN = 15;

const columnLabel = (column: Column<DataTableFeatures, never, never> | { id: string; columnDef: { header?: unknown } }): string =>
	typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;

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


	/* ── Persisted layout ─────────────────────────────────────────────────── */

	const { read, bind, reset: resetLayout } = useTablePrefs(moduleKey);

	const emptyVisibility = useMemo<ColumnVisibilityState>(() => initialColumnVisibility ?? {}, [initialColumnVisibility]);

	const columnVisibility = read('columnVisibility', emptyVisibility);
	const storedColumnSizing = read('columnSizing', NO_COLUMN_SIZING);
	const filterTags = read('filterTags', NO_FILTER_TAGS);
	const sortTags = read('sortTags', NO_SORT_TAGS);
	const showFilters = read('showFilters', false);
	const grouping = read('grouping', NO_GROUPING);
	const storedColumnOrder = read('columnOrder', NO_COLUMN_ORDER);

	/**
	 * Reconciled against the live definitions rather than restored as-is, so a column added after the layout was saved still shows up.
	 */
	const columnOrder = useMemo(() => {
		const available = columns.map((column) => resolveColumnId(column)).filter((id): id is string => id !== undefined);

		return storedColumnOrder.length === 0 ? available : reconcileColumnOrder(storedColumnOrder, available);
	}, [storedColumnOrder, columns]);

	const setColumnVisibility = bind('columnVisibility', columnVisibility);
	const persistColumnSizing = bind('columnSizing', storedColumnSizing);
	const setColumnOrder = bind('columnOrder', columnOrder);
	const setFilterTags = bind('filterTags', filterTags);
	const setSortTags = bind('sortTags', sortTags);
	const setShowFilters = bind('showFilters', showFilters);
	const setGrouping = bind('grouping', grouping);

	const toggleFilters = useCallback(() => setShowFilters((visible) => !visible), [setShowFilters]);

	/** Read off the stored state rather than off the table, so it can be asked before the table is built. */
	const isVisible = useCallback((columnId: string) => columnVisibility[columnId] ?? true, [columnVisibility]);


	/* ── Live column widths ───────────────────────────────────────────────── */

	/**
	 * The width a column has while its handle is still moving.
	 * Only the width it settles on reaches the store.
	 */
	const [draftColumnSizing, setDraftColumnSizing] = useState<ColumnSizingState | null>(null);

	const columnSizing = draftColumnSizing ?? storedColumnSizing;

	const handleColumnSizingChange = useCallback<OnChangeFn<ColumnSizingState>>(
		(updater) => setDraftColumnSizing((draft) => functionalUpdate(updater, draft ?? storedColumnSizing)),
		[storedColumnSizing],
	);


	/* ── Session-only state ───────────────────────────────────────────────── */

	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState('');
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});


	/* ── Pre-processing ───────────────────────────────────────────────────── */

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
	 * The columns the search box scans, and how each of them reads.
	 * Hidden columns are never scanned.
	 */
	const searchFields = useMemo<SearchField<T>[]>(() => {
		const fields: SearchField<T>[] = [];

		for (const column of columns) {
			const id = resolveColumnId(column);

			if (id === undefined || !isVisible(id) || column.meta?.globalSearch === false) {
				continue;
			}

			const read = sortResolution.sortValues.get(id) ?? ((row: T) => (row as Record<string, unknown>)[id]);

			if (column.meta?.globalSearch !== true && !holdsSearchableText(data, read)) {
				continue;
			}

			fields.push({ read, names: sortResolution.optionNames.get(id) });
		}

		return fields;
	}, [columns, isVisible, sortResolution, data]);

	/**
	 * Filter tags stay applied whether or not the filter bar is on screen.
	 */
	const processedData = useMemo<T[]>(() => {
		const filtered = filterTags.length > 0 ? applyFilterTags(data, filterTags) : data;
		const searched = applyGlobalSearch(filtered, globalFilter, searchFields);

		// Clicking a column header is a temporary override of the saved sort, not an addition to it.
		return sorting.length === 0 ? applyCustomSorts(searched, sortTags, sortResolution) : searched;
	}, [data, filterTags, globalFilter, searchFields, sortTags, sorting, sortResolution]);


	/* ── Table instance ───────────────────────────────────────────────────── */

	const rowId = useMemo(
		() => (getRowId ? (row: T) => getRowId(row) : undefined),
		[getRowId],
	);

	const table = useTable<DataTableFeatures, T>({
		features: dataTableFeatures,
		data: processedData,
		columns,
		getRowId: rowId,
		state: {
			sorting,
			columnOrder,
			columnVisibility,
			columnSizing,
			grouping,
			rowSelection,
		},
		columnResizeMode: 'onChange',
		enableColumnResizing: true,
		enableRowSelection,
		enableGrouping,
		groupedColumnMode: false,
		onSortingChange: setSorting,
		onColumnOrderChange: setColumnOrder,
		onColumnVisibilityChange: setColumnVisibility,
		onColumnSizingChange: handleColumnSizingChange,
		onGroupingChange: setGrouping,
		onRowSelectionChange: setRowSelection,
	});


	/**
	 * The width the drag settled on, written down once the handle is released.
	 */
	const isResizingColumn = table.state.columnResizing.isResizingColumn !== false;

	useEffect(() => {
		if (draftColumnSizing === null || isResizingColumn) {
			return;
		}

		persistColumnSizing(draftColumnSizing);
		setDraftColumnSizing(null);
	}, [draftColumnSizing, isResizingColumn, persistColumnSizing]);


	/* ── Derived views of the columns ─────────────────────────────────────── */

	const visibleLeafColumns = table.getVisibleLeafColumns();
	const allLeafColumns = table.getAllLeafColumns();

	const filterableColumns = useMemo<FilterableColumn[]>(
		() =>
			visibleLeafColumns
				.filter((column) => {
					const definition = column.columnDef as AppColumnDef<T>;

					return Boolean(definition.fieldType ?? column.columnDef.meta?.tagOptions?.length ?? column.columnDef.meta?.selectOptions?.length);
				})
				.map((column) => ({
					id: column.id,
					label: columnLabel(column),
					fieldType: (column.columnDef as AppColumnDef<T>).fieldType ?? 'text',
					tagOptions: column.columnDef.meta?.tagOptions,
					selectOptions: column.columnDef.meta?.selectOptions,
				})),
		[visibleLeafColumns],
	);

	const visibilityColumns = useMemo(
		() =>
			allLeafColumns.map((column) => ({
				id: column.id,
				label: columnLabel(column),
				visible: isVisible(column.id),
				toggle: () => column.toggleVisibility(),
			})),
		[allLeafColumns, isVisible],
	);

	const groupableColumns = useMemo(
		() =>
			allLeafColumns
				.filter((column) => isVisible(column.id) && column.columnDef.meta?.groupable)
				.map((column) => ({ id: column.id, label: columnLabel(column) })),
		[allLeafColumns, isVisible],
	);


	/* ── Column drag-reorder ──────────────────────────────────────────────── */

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (!over || active.id === over.id) {
				return;
			}

			const from = columnOrder.indexOf(String(active.id));
			const to = columnOrder.indexOf(String(over.id));

			if (from === -1 || to === -1) {
				return;
			}

			setColumnOrder(arrayMove(columnOrder, from, to));
		},
		[columnOrder, setColumnOrder],
	);


	/* ── Render inputs ────────────────────────────────────────────────────── */

	const visibleColumns = visibleLeafColumns.map((column) => ({ id: column.id, size: column.getSize() }));
	const orderedColumnIds = visibleColumns.map((column) => column.id);
	const totalWidth = visibleColumns.reduce((sum, column) => sum + column.size, 0);
	const bodyRows = table.getRowModel().rows;


	/* ── Row virtualisation ───────────────────────────────────────────────── */

	const scrollRef = useRef<HTMLDivElement>(null);

	/**
	 * Only the rows in view are mounted, so the whole dataset can sit in one scroll instead of being cut into pages.
	 * Sorting and filtering are always applied to all of the data.
	 *
	 * Lint reports "Compilation Skipped: Use of incompatible library" here, warning that values off this
	 * hook are unsafe to hand to a memoised component. `measureElement` is the one it means, and it is
	 * fine: the virtualizer is constructed once into `useState` and `measureElement` is bound to that
	 * instance, so its identity never changes and the `memo` on `DataTableRow` keeps holding. What has to
	 * stay true is that the rest of what is read off the virtualizer - `virtualRows`, `totalSize` - is
	 * read fresh each render rather than memoised on deps of its own.
	 */
	const rowVirtualizer = useVirtualizer({
		count: bodyRows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ESTIMATED_ROW_HEIGHT,
		overscan: ROW_OVERSCAN,
		getItemKey: (index) => bodyRows[index]?.id ?? index,
	});

	const virtualRows = rowVirtualizer.getVirtualItems();
	const totalSize = rowVirtualizer.getTotalSize();

	/**
	 * Heights of the two spacer rows that stand in for everything outside the window. Rendering them
	 * inside `<tbody>` keeps real rows in normal table flow, which is what lets `table-layout: fixed`,
	 * the sticky header, and the column drag handles carry on working untouched.
	 */
	const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
	const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

	/**
	 * A narrower filter leaves fewer rows than the scroll position assumes, which without this drops
	 * the user onto an empty stretch below the last match. Vertical only - horizontal position is
	 * about which columns you were looking at, and a filter change is no reason to lose it.
	 */
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = 0;
		}
	}, [filterTags, sortTags, globalFilter, sorting]);


	/* ── Cell editor popovers ─────────────────────────────────────────────── */

	/** The sticky header, measured so a cell editor can tell when its trigger has slid under it. */
	const headRef = useRef<HTMLTableSectionElement>(null);

	/**
	 * Where a cell editor's panel stops being worth drawing.
	 *
	 * A panel is portalled to the body and drawn above everything, so the sticky header cannot cover it.
	 * Without this, scrolling with an editor open dragged the panel up across the header and out of
	 * the table altogether. `hide()` asks whether the trigger is still visible, and this says what
	 * visible means here - inside the scroll container and not behind the header floating over its top
	 * edge.
	 */
	const popoverClip = useCallback<PopoverClip>(
		() => ({
			boundary: scrollRef.current ?? 'clippingAncestors',
			padding: { top: headRef.current?.offsetHeight ?? 0 },
		}),
		[],
	);

	return {
		globalFilter, setGlobalFilter,
		showFilters, toggleFilters,
		filterTags, setFilterTags,
		sortTags, setSortTags,
		grouping, setGrouping,
		filterableColumns, visibilityColumns, groupableColumns,
		enableGrouping, toolbarStart, toolbar,
		onCellEdit, onRowClick, onRowContextMenu,
		emptyMessage, isLoading,
		sensors, handleDragEnd, orderedColumnIds,
		headerGroups: table.getHeaderGroups(),
		totalWidth, bodyRows,
		scrollRef, headRef, popoverClip,
		virtualRows, paddingTop, paddingBottom,
		measureRow: rowVirtualizer.measureElement,
		filteredRowCount: table.getFilteredRowModel().rows.length,
		totalRowCount: data.length,
		resetLayout,
		maxFilterTags, maxAdvancedRules,
	};
};

/**
 * A column definition's id, whether it was given one outright or is implied by a string accessor or header.
 * Mirrors how TanStack derives ids, so a reconciled order lines up with the real columns.
 */
function resolveColumnId<T extends object>(column: AppColumnDef<T>): string | undefined {
	if ('id' in column && typeof column.id === 'string') {
		return column.id;
	}

	if ('accessorKey' in column && typeof column.accessorKey === 'string') {
		return column.accessorKey;
	}

	return typeof column.header === 'string' ? column.header : undefined;
}
