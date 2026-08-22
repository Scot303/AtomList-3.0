import { DateCellPicker } from '@/components/ui/fields/DateCellPicker';
import { formatLongDate } from '@/utils/dateUtils.ts';
import { CellPlaceholder } from './CellPlaceholder';
import type { CellEditorProps } from './cellTypes';
import { useOptimisticCellValue } from './useOptimisticCellValue';


/**
 * A date edited in place.
 * There is no local editing flag, for the same reason as {@link TagCell}.
 */
export const DateCell = ({ value, rowId, columnId, meta, onCommit, onEditingChange }: CellEditorProps) => {
	const committed = String(value ?? '');
	const optimistic = useOptimisticCellValue(committed);

	/**
	 * Formatted by default, rather than showing the stored `YYYY-MM-DD`.
	 *
	 * The cell used to print the raw ISO string while the picker that edits it showed
	 * "15 stycznia 2026", so the same date read two different ways depending on whether you were
	 * looking at it or changing it. A column can still override this with `meta.displayFormatter`.
	 */
	const display = meta.displayFormatter
		? meta.displayFormatter(optimistic.value || value)
		: formatLongDate(optimistic.value);

	return (
		<DateCellPicker
			value={ optimistic.value }
			onChange={ (next) => {
				optimistic.setOptimistic(next);
				onCommit(rowId, columnId, next);
			} }
			onOpenChange={ onEditingChange }
		>
			<span className="truncate">
				{ display === '' || display == null ? <CellPlaceholder/> : display }
			</span>
		</DateCellPicker>
	);
};
