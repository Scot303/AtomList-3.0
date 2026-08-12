import { BooleanCell } from './BooleanCell';
import { DateCell } from './DateCell';
import { OptionCell } from './OptionCell';
import { TagCell } from './TagCell';
import { TextCell } from './TextCell';
import type { CellEditorProps } from './cellTypes';

/**
 * Picks the editor a cell should use.
 * The column's options win over its declared `fieldType`.
 */
export const EditableCell = (props: CellEditorProps) => {
	const { fieldType, meta } = props;

	if (meta.tagOptions) {
		return <TagCell { ...props } multiple={ meta.multiTag === true }/>;
	}

	if (meta.selectOptions) {
		return <OptionCell { ...props }/>;
	}

	if (fieldType === 'date') {
		return <DateCell { ...props }/>;
	}

	if (fieldType === 'boolean') {
		return <BooleanCell { ...props }/>;
	}

	return <TextCell { ...props }/>;
};
