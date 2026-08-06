import type React from 'react';

export type SelectSize = 'default' | 'sm';

export type SelectPanelTheme = 'modal' | 'glass';

export interface SelectOption {
	id: string;
	name: string;
	icon?: React.ReactNode;
	disabled?: boolean;
	/** Muted note shown after the name. Worth setting whenever `disabled` is, to say why. */
	hint?: string;
}

/**
 * Turns the panel into a creation form until the form calls back.
 *
 * A render prop rather than a concrete form, because what it takes to create one of these is the
 * caller's business - the panel only needs to know the id to select once it exists.
 */
export interface SelectAddNew {
	label: string;
	renderForm: (onCancel: () => void, onSaved: (newId: string) => void) => React.ReactNode;
}

export type SelectPanelMode = 'select' | 'add';

/**
 * Pair it with {@link '@/components/ui/select/selectValue'.bindSelectValue} to read and update it.
 */
export type SelectValueProps =
	| { multiple?: false; value: string | undefined; onChange: (value: string | undefined) => void }
	| { multiple: true; value: string[]; onChange: (value: string[]) => void };
