import type { SelectValueProps } from './selectTypes';

export interface SelectValueBinding {
	/** The selection as a list, whether the select holds one value or many. */
	selectedIds: string[];
	isMultiple: boolean;
	/** Adds the option when it is not selected, removes it when it is. */
	toggle: (id: string) => void;
	clear: () => void;
}

/**
 * Collapses the single/multiple split into one shape the components can work with.
 */
export function bindSelectValue(props: SelectValueProps): SelectValueBinding {
	if (props.multiple) {
		const { value, onChange } = props;

		return {
			selectedIds: value,
			isMultiple: true,
			toggle: (id) => onChange(value.includes(id) ? value.filter((selected) => selected !== id) : [...value, id]),
			clear: () => onChange([]),
		};
	}

	const { value, onChange } = props;

	return {
		selectedIds: value === undefined ? [] : [value],
		isMultiple: false,
		toggle: (id) => onChange(value === id ? undefined : id),
		clear: () => onChange(undefined),
	};
}
