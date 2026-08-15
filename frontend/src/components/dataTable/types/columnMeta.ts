import type React from 'react';
import type { TagOption } from '@/components/ui/tags';
import type { SelectAddNew } from '@/components/ui/select';
import type { ExtendedSelectOption } from '@/components/ui/extendedSelect';

/**
 * What kind of value a column holds. Drives the cell editor, the filter operators offered for it,
 * and how {@link applyCustomSorts} compares two of its values.
 */
export type FieldType = 'text' | 'number' | 'date' | 'tag' | 'select' | 'boolean';

/**
 * Per-column configuration.
 */
export interface AppColumnMeta {
	/** Lets the cell be edited in place. Requires `onCellEdit` on the table. */
	editable?: boolean;
	groupable?: boolean;
	tagOptions?: TagOption[];
	selectOptions?: ExtendedSelectOption[];
	/** Adds a search box to the tag/select editor's panel. Unrelated to {@link globalSearch}. */
	searchable?: boolean;
	/** Whether the editor may unset the value. Defaults to true. */
	clearable?: boolean;
	/**
	 * Whether the toolbar's search box scans this column.
	 *
	 * Left unset, a column is scanned when it holds text or numbers, which leaves out tag arrays and booleans.
	 * Hidden columns are never scanned, whatever this says.
	 */
	globalSearch?: boolean;
	/** Stores an array of tag ids instead of a single one. */
	multiTag?: boolean;
	/** Lets the editor's panel create a new option inline. */
	addNewTag?: SelectAddNew;
	addNewSelectOption?: SelectAddNew;
	/**
	 * Overrides what a non-editing cell shows, without changing the value that gets filtered or sorted.
	 * The toolbar's search box matches the text this produces as well as the stored value.
	 */
	displayFormatter?: (value: unknown) => React.ReactNode;
}
