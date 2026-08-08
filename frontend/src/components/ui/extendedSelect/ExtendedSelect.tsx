import type React from 'react';
import { useId } from 'react';
import { useSelectPopover } from '@/hooks/useSelectPopover';
import type { SelectSize, SelectValueProps } from '@/components/ui/select';
import { bindSelectValue, SelectField, SelectPanel } from '@/components/ui/select';
import { ExtendedSelectValue } from './ExtendedSelectValue';
import type { ExtendedSelectAddNew, ExtendedSelectOption } from './extendedSelectTypes';

interface ExtendedSelectOwnProps {
	options: ExtendedSelectOption[];
	onBlur?: () => void;
	label?: string;
	leftIcon?: React.ReactNode;
	className?: string;
	disabled?: boolean;
	clearable?: boolean;
	searchable?: boolean;
	size?: SelectSize;
	error?: string;
	placeholder?: string;
	maxVisible?: number;
	addNew?: ExtendedSelectAddNew;
}

export type ExtendedSelectProps = ExtendedSelectOwnProps & SelectValueProps;

/**
 * A searchable select that reads as a form field. Single by default; pass `multiple` for a list.
 */
export const ExtendedSelect = (props: ExtendedSelectProps) => {
	const {
		options,
		onBlur,
		label,
		leftIcon,
		className,
		disabled,
		clearable,
		searchable = true,
		size = 'default',
		error,
		placeholder,
		maxVisible,
		addNew,
	} = props;

	const id = useId();
	const popover = useSelectPopover({ onBlur, width: 'trigger', addModeWidth: '22rem' });
	const value = bindSelectValue(props);

	const selectedOptions = options.filter((option) => value.selectedIds.includes(option.id));

	const handleSelect = (optionId: string) => {
		value.toggle(optionId);

		if (!value.isMultiple) {
			popover.close();
		}
	};

	return (
		<SelectField
			popover={ popover }
			id={ id }
			label={ label }
			error={ error }
			size={ size }
			leftIcon={ leftIcon }
			placeholder={ placeholder }
			disabled={ disabled }
			clearable={ clearable }
			onClear={ value.clear }
			className={ className }
			hasValue={ selectedOptions.length > 0 }
			renderValue={ () => <ExtendedSelectValue options={ selectedOptions } multiple={ value.isMultiple } maxVisible={ maxVisible }/> }
		>
			<SelectPanel
				options={ options }
				selectedIds={ value.selectedIds }
				onSelect={ handleSelect }
				onClear={ clearable ? value.clear : undefined }
				clearable={ clearable }
				searchable={ searchable }
				multiple={ value.isMultiple }
				theme="modal"
				addNew={ addNew }
				onModeChange={ (mode) => popover.setIsAddMode(mode === 'add') }
			/>
		</SelectField>
	);
};
