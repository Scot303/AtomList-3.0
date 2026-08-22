import type { Column } from '@tanstack/react-table';
import type { AppColumnDef, DataTableFeatures } from '@/components/dataTable';


/**
 * A column definition's id, whether it was given one outright or is implied by a string accessor or header.
 * Mirrors how TanStack derives ids, so a reconciled order lines up with the real columns.
 */
export function resolveColumnId<T extends object>(column: AppColumnDef<T>): string | undefined {
	if ('id' in column && typeof column.id === 'string') {
		return column.id;
	}

	if ('accessorKey' in column && typeof column.accessorKey === 'string') {
		return column.accessorKey;
	}

	return typeof column.header === 'string' ? column.header : undefined;
}


/**
 * What a column is called in the UI - its header when that is plain text, and its id when the header is a node.
 */
export function columnLabel(
	column: Column<DataTableFeatures, never, never> | { id: string; columnDef: { header?: unknown } },
): string {
	return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
}


/**
 * Reconciles a stored column order against the columns that actually exist now.
 *
 * Unknown ids are dropped and new ones are appended in their defined position relative to the columns already placed.
 */
export function reconcileColumnOrder(stored: string[], available: string[]): string[] {
	const live = new Set(available);
	const kept = stored.filter((id) => live.has(id));

	if (kept.length === available.length) {
		return kept;
	}

	const placed = new Set(kept);
	const result = [...kept];

	// Insert each new column where it sits among the columns already present, so a column added in
	// the middle of the definitions does not always land at the far right.
	available.forEach((id, index) => {
		if (placed.has(id)) {
			return;
		}

		const previous = available.slice(0, index).reverse().find((candidate) => placed.has(candidate));
		const at = previous === undefined ? 0 : result.indexOf(previous) + 1;

		result.splice(at, 0, id);
		placed.add(id);
	});

	return result;
}
