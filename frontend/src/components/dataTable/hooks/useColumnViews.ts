import { useMemo } from 'react';
import { flexRender, type Table } from '@tanstack/react-table';
import type { DataTableFeatures } from '@/components/dataTable';
import type { AppColumnDef, RenderHeader, RenderHeaderGroup } from '../types/dataTableTypes';
import type { FilterableColumn } from '../types/filterTypes';
import { columnLabel } from '../utils/columnIds';


export interface ColumnViews {
	filterableColumns: FilterableColumn[];
	visibilityColumns: { id: string; label: string; visible: boolean; toggle: () => void }[];
	groupableColumns: { id: string; label: string }[];
	headerGroups: RenderHeaderGroup[];
	/** In drawn order, which is what the drag-reorder sensor sorts on. */
	orderedColumnIds: string[];
	/** The table's own width, since `table-layout: fixed` needs it stated. */
	totalWidth: number;
}


/**
 * Every view of the columns the UI draws.
 */
export function useColumnViews<T extends object>(table: Table<DataTableFeatures, T>, isVisible: (columnId: string) => boolean): ColumnViews {
	'use no memo';

	const visibleLeafColumns = table.getVisibleLeafColumns();
	const allLeafColumns = table.getAllLeafColumns();

	const filterableColumns = useMemo<FilterableColumn[]>(
		() =>
			visibleLeafColumns
				.filter((column) => {
					const definition = column.columnDef as AppColumnDef<T>;

					return Boolean(definition.fieldType ?? column.columnDef.meta?.tagOptions?.length ?? column.columnDef.meta?.selectOptions?.length);
				})
				.map((column) => ( {
					id: column.id,
					label: columnLabel(column),
					fieldType: ( column.columnDef as AppColumnDef<T> ).fieldType ?? 'text',
					tagOptions: column.columnDef.meta?.tagOptions,
					selectOptions: column.columnDef.meta?.selectOptions,
				} )),
		[visibleLeafColumns],
	);

	const visibilityColumns = useMemo(
		() =>
			allLeafColumns.map((column) => ( {
				id: column.id,
				label: columnLabel(column),
				visible: isVisible(column.id),
				toggle: () => column.toggleVisibility(),
			} )),
		[allLeafColumns, isVisible],
	);

	const groupableColumns = useMemo(
		() =>
			allLeafColumns
				.filter((column) => isVisible(column.id) && column.columnDef.meta?.groupable)
				.map((column) => ( { id: column.id, label: columnLabel(column) } )),
		[allLeafColumns, isVisible],
	);


	const headerGroups = table.getHeaderGroups().map<RenderHeaderGroup>((headerGroup) => ( {
		id: headerGroup.id,
		headers: headerGroup.headers.map<RenderHeader>((header) => {
			const { column } = header;

			return {
				id: header.id,
				columnId: column.id,
				label: columnLabel(column),
				content: header.isPlaceholder ? null : flexRender(column.columnDef.header, header.getContext()),
				size: header.getSize(),
				sorted: column.getIsSorted(),
				canSort: column.getCanSort(),
				canResize: column.getCanResize(),
				isResizing: column.getIsResizing(),
				onToggleSort: column.getToggleSortingHandler(),
				onResizeStart: header.getResizeHandler(),
				onResizeStep: (delta) => {
					const { minSize = 0, maxSize = Number.MAX_SAFE_INTEGER } = column.columnDef;
					const next = Math.min(maxSize, Math.max(minSize, header.getSize() + delta));

					table.setColumnSizing((sizing) => ( { ...sizing, [column.id]: next } ));
				},
			};
		}),
	} ));

	const visibleColumns = visibleLeafColumns.map((column) => ( { id: column.id, size: column.getSize() } ));

	return {
		filterableColumns,
		visibilityColumns,
		groupableColumns,
		headerGroups,
		orderedColumnIds: visibleColumns.map((column) => column.id),
		totalWidth: visibleColumns.reduce((sum, column) => sum + column.size, 0),
	};
}
