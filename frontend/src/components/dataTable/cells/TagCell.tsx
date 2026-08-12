import { TagCellSelect } from '@/components/ui/tags';
import { dataTableStrings } from '@/components/dataTable';
import type { CellEditorProps } from './cellTypes';
import { sameIdList, useOptimisticCellValue } from './useOptimisticCellValue';

interface TagCellProps extends CellEditorProps {
	multiple: boolean;
}

/**
 * Tags edited in place.
 *
 * There is no local editing flag: `TagCellSelect` is its own trigger, drawing the badges as the button that opens the panel.
 * The open panel is still what "being edited" means here, so the row hears about it the same way it hears about a text cell's input.
 */
export const TagCell = ({ value, rowId, columnId, meta, onCommit, onEditingChange, multiple }: TagCellProps) => {
	const committed = toIdList(value);
	const optimistic = useOptimisticCellValue(committed, sameIdList);

	const commit = (ids: string[]) => {
		optimistic.setOptimistic(ids);
		onCommit(rowId, columnId, multiple ? ids : ids[0] ?? null);
	};

	const shared = {
		options: meta.tagOptions ?? [],
		searchable: meta.searchable,
		addNew: meta.addNewTag,
		placeholder: dataTableStrings.cell.empty,
		className: 'w-full',
		onOpenChange: onEditingChange,
	};

	return multiple ? (
		<TagCellSelect
			{ ...shared }
			multiple
			value={ optimistic.value }
			onChange={ commit }
			clearable
		/>
	) : (
		<TagCellSelect
			{ ...shared }
			value={ optimistic.value[0] }
			onChange={ (id) => commit(id === undefined ? [] : [id]) }
			clearable
		/>
	);
};

function toIdList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map(String);
	}

	return value == null || value === '' ? [] : [String(value)];
}
