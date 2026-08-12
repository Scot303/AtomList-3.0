import type { AppColumnMeta, FieldType } from '../types/columnMeta';

/** What every in-place cell editor is handed. */
export interface CellEditorProps {
	value: unknown;
	rowId: string;
	columnId: string;
	fieldType: FieldType | undefined;
	meta: AppColumnMeta;
	onCommit: (rowId: string, columnId: string, value: unknown) => void;
	/** Lets the row highlight the cell being edited. */
	onEditingChange?: (editing: boolean) => void;
}
