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
 *
 * Registered as the `columnMeta` slot of {@link dataTableFeatures} rather than through global `declare module` augmentation,
 * so it applies to this table's feature set only and does not leak onto every other table in the app.
 */
export interface AppColumnMeta {
	/** Lets the cell be edited in place. Requires `onCellEdit` on the table. */
	editable?: boolean;
	groupable?: boolean;
	tagOptions?: TagOption[];
	selectOptions?: ExtendedSelectOption[];
	/** Adds a search box to the tag/select editor's panel. */
	searchable?: boolean;
	/** Stores an array of tag ids instead of a single one. */
	multiTag?: boolean;
	/** Lets the editor's panel create a new option inline. */
	addNewTag?: SelectAddNew;
	addNewSelectOption?: SelectAddNew;
	/** Overrides what a non-editing cell shows, without changing the value that gets filtered or sorted. */
	displayFormatter?: (value: unknown) => React.ReactNode;
}
