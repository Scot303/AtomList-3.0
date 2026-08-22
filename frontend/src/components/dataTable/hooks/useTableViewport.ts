import { type RefObject, useCallback, useEffect, useRef } from 'react';
import type { Row, SortingState, Table } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { PopoverClip } from '@/hooks/usePopoverClip';
import type { DataTableFeatures } from '@/components/dataTable';
import type { RenderRow } from '../types/dataTableTypes';
import type { FilterActiveTag, SortTag } from '../types/filterTypes';


/**
 * Height a row is assumed to have before it has been measured. Only shows up in the scrollbar's length on the first paint.
 * `measureElement` replaces it with each row's real height.
 */
const ESTIMATED_ROW_HEIGHT = 45;

/** Rows kept mounted either side of the window, so a fast scroll does not outrun the render. */
const ROW_OVERSCAN = 15;


/** What the scroll position should be thrown away for - a narrower result set leaves it pointing past the end. */
interface ViewportReset {
	filterTags: FilterActiveTag[];
	sortTags: SortTag[];
	globalFilter: string;
	sorting: SortingState;
}


export interface TableViewport<T extends object> {
	scrollRef: RefObject<HTMLDivElement | null>;
	/** The sticky header, measured so a cell editor can tell when its trigger has slid under it. */
	headRef: RefObject<HTMLTableSectionElement | null>;
	popoverClip: PopoverClip;
	/** Every row the table holds after grouping - what `aria-rowcount` and the empty state are counted from. */
	bodyRows: Row<DataTableFeatures, T>[];
	/** Only the rows inside the drawn window. */
	renderRows: RenderRow<T>[];
	paddingTop: number;
	paddingBottom: number;
	measureRow: (element: Element | null) => void;
	filteredRowCount: number;
}


/**
 * The scrolling viewport: which rows are mounted, how far the ones outside the window are stood in for, and
 * where a cell editor's panel stops being worth drawing.
 */
export function useTableViewport<T extends object>(table: Table<DataTableFeatures, T>, reset: ViewportReset): TableViewport<T> {
	'use no memo';

	const scrollRef = useRef<HTMLDivElement>(null);
	const headRef = useRef<HTMLTableSectionElement>(null);

	const bodyRows = table.getRowModel().rows;

	/**
	 * Only the rows in view are mounted, so the whole dataset can sit in one scroll instead of being cut into pages.
	 * Sorting and filtering are always applied to all of the data.
	 */
		// eslint-disable-next-line react-hooks/incompatible-library
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
	 * The rows the body draws, with each one's cells resolved here rather than inside the body.
	 */
	const renderRows = virtualRows.map<RenderRow<T>>((virtualRow) => {
		const row = bodyRows[virtualRow.index];

		return { row, cells: row.getVisibleCells(), index: virtualRow.index, isGrouped: row.getIsGrouped() };
	});

	/**
	 * Heights of the two spacer rows that stand in for everything outside the window. Rendering them
	 * inside `<tbody>` keeps real rows in normal table flow, which is what lets `table-layout: fixed`,
	 * the sticky header, and the column drag handles carry on working untouched.
	 */
	const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
	const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

	/**
	 * A narrower filter leaves fewer rows than the scroll position assumes, which without this drops
	 * the user onto an empty stretch below the last match.
	 */
	const { filterTags, sortTags, globalFilter, sorting } = reset;

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = 0;
		}
	}, [filterTags, sortTags, globalFilter, sorting]);

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
		() => ( {
			boundary: scrollRef.current ?? 'clippingAncestors',
			padding: { top: headRef.current?.offsetHeight ?? 0 },
		} ),
		[],
	);

	return {
		scrollRef,
		headRef,
		popoverClip,
		bodyRows,
		renderRows,
		paddingTop,
		paddingBottom,
		measureRow: rowVirtualizer.measureElement,
		filteredRowCount: table.getFilteredRowModel().rows.length,
	};
}
