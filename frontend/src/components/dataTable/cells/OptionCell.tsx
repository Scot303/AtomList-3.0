import { ExtendedCellSelect } from '@/components/ui/extendedSelect';
import { dataTableStrings } from '@/components/dataTable';
import type { CellEditorProps } from './cellTypes';
import { useOptimisticCellValue } from './useOptimisticCellValue';

/**
 * A single choice from a list of options, edited in place.
 * Like {@link TagCell}, the value itself is the trigger, so there is no separate editing mode.
 */
export const OptionCell = ({ value, rowId, columnId, meta, onCommit, onEditingChange }: CellEditorProps) => {
	const committed = value == null || value === '' ? undefined : String(value);
	const optimistic = useOptimisticCellValue(committed);

	return (
		<ExtendedCellSelect
			options={ meta.selectOptions ?? [] }
			value={ optimistic.value }
			onChange={ (next) => {
				optimistic.setOptimistic(next);
				onCommit(rowId, columnId, next ?? null);
			} }
			onOpenChange={ onEditingChange }
			searchable={ meta.searchable }
			addNew={ meta.addNewSelectOption }
			placeholder={ dataTableStrings.cell.empty }
			className="w-full"
		/>
	);
};
