import { Checkbox } from '@/components/ui/fields/Checkbox';
import type { CellEditorProps } from './cellTypes';
import { useOptimisticCellValue } from './useOptimisticCellValue';

/**
 * A checkbox that commits the moment it is clicked - there is nothing to confirm about a boolean, so it has no editing mode at all.
 */
export const BooleanCell = (props: CellEditorProps) => {
	const { value, rowId, columnId, onCommit } = props;

	// Kept as a real boolean.
	const optimistic = useOptimisticCellValue(Boolean(value));

	return (
		<span className="flex w-full items-center" onClick={ (event) => event.stopPropagation() }>
			<Checkbox
				size="sm"
				checked={ optimistic.value }
				onChange={ (event) => {
					const next = event.target.checked;

					optimistic.setOptimistic(next);
					onCommit(rowId, columnId, next);
				} }
			/>
		</span>
	);
};
