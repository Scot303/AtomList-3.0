import { memo, type MouseEvent, type ReactNode, useState } from 'react';
import { type Cell, flexRender, type Row } from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { popoverAnchorProps } from '@/lib/popoverAnchor';
import { EditableCell } from '../cells/EditableCell';
import type { AppColumnDef } from '@/components/dataTable';
import type { DataTableFeatures } from '../tableFeatures';


interface DataTableRowProps<T extends object> {
	row: Row<DataTableFeatures, T>;
	/** This row's place in the virtual list. `data-index` is how the measurer identifies it. */
	virtualIndex: number;
	measureRow: (node: HTMLTableRowElement | null) => void;
	onCellEdit?: (rowId: string, columnId: string, value: unknown) => void;
	onRowClick?: (row: T) => void;
	onRowContextMenu?: (event: MouseEvent, row: T) => void;
	/** Whether this is the row the open context menu acts on. */
	isContextTarget?: boolean;
	onContextRowChange?: (rowId: string) => void;
}


/**
 * One data row.
 */
const DataTableRowInner = <T extends object>(props: DataTableRowProps<T>) => {
	const { row, virtualIndex, measureRow, onCellEdit, onRowClick, onRowContextMenu, isContextTarget, onContextRowChange } = props;

	const [editingCellId, setEditingCellId] = useState<string | null>(null);

	return (
		<tr
			ref={ measureRow }
			data-index={ virtualIndex }
			// The real position in the full dataset, which the row's position in the DOM no longer gives away because only a window of rows is mounted.
			aria-rowindex={ virtualIndex + 2 }
			className={ cn(
				'border-b border-os-border/40 transition-colors hover:bg-os-bg-highlight',
				isContextTarget && 'bg-os-bg-highlight',
			) }
			onClick={ onRowClick ? () => onRowClick(row.original) : undefined }
			onContextMenu={ onRowContextMenu
				? (event) => {
					event.stopPropagation();
					onContextRowChange?.(row.id);
					onRowContextMenu(event, row.original);
				}
				: undefined
			}
		>
			{ row.getVisibleCells().map((cell) => {
				const definition = cell.column.columnDef as AppColumnDef<T>;
				const meta = definition.meta ?? {};
				const isEditing = editingCellId === cell.id;

				return (
					<td
						key={ cell.id }
						style={ { width: cell.column.getSize() } }
						{ ...popoverAnchorProps }
						className={ cn(
							'overflow-hidden text-ellipsis whitespace-nowrap px-4 py-2.5 text-os-text',
							isEditing && 'bg-os-surface/60 ring-1 ring-inset ring-os-border',
						) }
					>
						{ meta.editable && onCellEdit ? (
							<EditableCell
								value={ cell.getValue() }
								rowId={ row.id }
								columnId={ cell.column.id }
								fieldType={ definition.fieldType }
								meta={ meta }
								onCommit={ onCellEdit }
								onEditingChange={ (editing) => setEditingCellId(editing ? cell.id : null) }
							/>
						) : (
							flexRender(cell.column.columnDef.cell, cell.getContext())
						) }
					</td>
				);
			}) }
		</tr>
	);
};

export const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner;


/* ── Grouped row ─────────────────────────────────────────────────────────── */

interface DataTableGroupRowProps<T extends object> {
	row: Row<DataTableFeatures, T>;
	virtualIndex: number;
	measureRow: (node: HTMLTableRowElement | null) => void;
}


/** A grouping header: the grouped value, a count of what is under it, and a disclosure arrow. */
export const DataTableGroupRow = <T extends object>({ row, virtualIndex, measureRow }: DataTableGroupRowProps<T>) => (
	<tr
		ref={ measureRow }
		data-index={ virtualIndex }
		aria-rowindex={ virtualIndex + 2 }
		className="cursor-pointer border-b border-os-border/40 bg-os-surface/60 transition-colors hover:bg-os-surface/80"
		onClick={ row.getToggleExpandedHandler() }
	>
		{ row.getVisibleCells().map((cell) => (
			<td
				key={ cell.id }
				style={ { width: cell.column.getSize() } }
				className="px-4 py-2.5 font-semibold text-os-text"
			>
				{ cell.getIsGrouped() ? (
					<span className="flex items-center gap-2">
						{ row.getIsExpanded() ? <ChevronDown size={ 14 }/> : <ChevronRight size={ 14 }/> }
						{ groupLabel(cell) }
						<span className="ml-1 text-xs font-normal text-os-text-muted">({ row.subRows.length })</span>
					</span>
				) : cell.getIsAggregated() && cell.column.columnDef.aggregatedCell ? (
					flexRender(cell.column.columnDef.aggregatedCell, cell.getContext())
				) : null }
			</td>
		)) }
	</tr>
);


/**
 * The value a grouping header stands for.
 */
function groupLabel<T extends object>(cell: Cell<DataTableFeatures, T>): ReactNode {
	const definition = cell.column.columnDef as AppColumnDef<T>;

	if (definition.cell === undefined && definition.meta?.displayFormatter) {
		return definition.meta.displayFormatter(cell.getValue());
	}

	return flexRender(definition.cell, cell.getContext());
}
