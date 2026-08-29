import { useCallback, useMemo, useState } from 'react';
import { type ColumnOrderState, type ColumnSizingState, type ColumnVisibilityState, functionalUpdate, type GroupingState, type OnChangeFn, } from '@tanstack/react-table';
import type { FilterActiveTag, SortTag } from '../types/filterTypes';
import type { AppColumnDef } from '@/components/dataTable';
import { reconcileColumnOrder, resolveColumnId } from '../utils/columnIds';
import { NO_COLUMN_ORDER, NO_COLUMN_SIZING, NO_COLUMN_VISIBILITY, NO_FILTER_TAGS, NO_GROUPING, NO_SORT_TAGS } from './prefsFallbacks';
import { useTablePrefs } from './useTablePrefs';


/**
 * A table's arrangement as the rest of the hooks see it: the slices that survive a reload, plus the column widths that have not settled yet.
 */
export interface TableLayout {
	columnVisibility: ColumnVisibilityState;
	setColumnVisibility: OnChangeFn<ColumnVisibilityState>;
	columnOrder: ColumnOrderState;
	setColumnOrder: OnChangeFn<ColumnOrderState>;
	grouping: GroupingState;
	setGrouping: OnChangeFn<GroupingState>;
	filterTags: FilterActiveTag[];
	setFilterTags: OnChangeFn<FilterActiveTag[]>;
	sortTags: SortTag[];
	setSortTags: OnChangeFn<SortTag[]>;
	showFilters: boolean;
	toggleFilters: () => void;
	/** Whether a column is on screen, answerable before the table is built. */
	isVisible: (columnId: string) => boolean;
	/** The widths in force right now - a drag in progress if there is one, the stored ones otherwise. */
	columnSizing: ColumnSizingState;
	onColumnSizingChange: OnChangeFn<ColumnSizingState>;
	/** Set while a resize handle is moving, and the value {@link useTableInstance} writes down on release. */
	draftColumnSizing: ColumnSizingState | null;
	clearDraftColumnSizing: () => void;
	persistColumnSizing: OnChangeFn<ColumnSizingState>;
	/** Forgets this table's layout entirely. */
	reset: () => void;
}


/**
 * Everything about how one table is arranged, bound to the signed-in user's stored preferences.
 */
export function useTableLayout<T extends object>(moduleKey: string, columns: AppColumnDef<T>[], initialColumnVisibility: ColumnVisibilityState | undefined): TableLayout {
	const { read, bind, reset } = useTablePrefs(moduleKey);

	const defaultVisibility = useMemo<ColumnVisibilityState>(
		() => initialColumnVisibility ?? {},
		[initialColumnVisibility],
	);

	const storedColumnVisibility = read('columnVisibility', NO_COLUMN_VISIBILITY);
	const storedColumnSizing = read('columnSizing', NO_COLUMN_SIZING);
	const filterTags = read('filterTags', NO_FILTER_TAGS);
	const sortTags = read('sortTags', NO_SORT_TAGS);
	const showFilters = read('showFilters', false);
	const grouping = read('grouping', NO_GROUPING);
	const storedColumnOrder = read('columnOrder', NO_COLUMN_ORDER);

	/**
	 * Laid over the table's defaults rather than restored as-is, so a column added after the layout was saved
	 * starts hidden or shown as the table declared it, instead of simply appearing.
	 * Anything the user has actually toggled is in the stored map and still wins.
	 */
	const columnVisibility = useMemo(
		() => ( { ...defaultVisibility, ...storedColumnVisibility } ),
		[defaultVisibility, storedColumnVisibility],
	);

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

	/**
	 * The width a column has while its handle is still moving.
	 * Only the width it settles on reaches the store.
	 */
	const [draftColumnSizing, setDraftColumnSizing] = useState<ColumnSizingState | null>(null);

	const onColumnSizingChange = useCallback<OnChangeFn<ColumnSizingState>>(
		(updater) => setDraftColumnSizing((draft) => functionalUpdate(updater, draft ?? storedColumnSizing)),
		[storedColumnSizing],
	);

	const clearDraftColumnSizing = useCallback(() => setDraftColumnSizing(null), []);

	return {
		columnVisibility, setColumnVisibility,
		columnOrder, setColumnOrder,
		grouping, setGrouping,
		filterTags, setFilterTags,
		sortTags, setSortTags,
		showFilters, toggleFilters,
		isVisible,
		columnSizing: draftColumnSizing ?? storedColumnSizing,
		onColumnSizingChange,
		draftColumnSizing, clearDraftColumnSizing, persistColumnSizing,
		reset,
	};
}
