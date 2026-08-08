import { dataTableStrings } from '@/components/dataTable';

interface DataTableStatusBarProps {
	/** Rows that survived the filters - what is actually scrollable. */
	filteredRowCount: number;
	/** Rows the caller handed over, before any filtering. */
	totalRowCount: number;
}

/**
 * How much data is in the table, and how much of it the filters are hiding.
 */
export const DataTableStatusBar = ({ filteredRowCount, totalRowCount }: DataTableStatusBarProps) => (
	<div className="flex shrink-0 items-center justify-between border-t border-os-border px-4 py-2.5">
		<span aria-live="polite" className="text-xs text-os-text-muted">
			{ filteredRowCount < totalRowCount
				? dataTableStrings.status.filtered(filteredRowCount, totalRowCount)
				: dataTableStrings.status.rows(totalRowCount) }
		</span>
	</div>
);
