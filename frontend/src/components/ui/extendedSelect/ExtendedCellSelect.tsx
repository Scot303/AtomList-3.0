import { useSelectPopover } from '@/hooks/useSelectPopover';
import type { SelectValueProps } from '@/components/ui/select';
import { bindSelectValue, SelectCell, SelectPanel } from '@/components/ui/select';
import { ExtendedSelectValue } from './ExtendedSelectValue';
import type { ExtendedSelectAddNew, ExtendedSelectOption } from './extendedSelectTypes';

interface ExtendedCellSelectOwnProps {
	options: ExtendedSelectOption[];
	onBlur?: () => void;
	/** The panel's width. The trigger is usually far too narrow to size it from. */
	popoverWidth?: string;
	searchable?: boolean;
	addNew?: ExtendedSelectAddNew;
	disabled?: boolean;
	/** Shown in place of the value when nothing is selected. */
	placeholder?: string;
	ariaLabel?: string;
	/** Hover text. Worth setting alongside `disabled`, to say why it cannot be changed. */
	title?: string;
	maxVisible?: number;
	className?: string;
}

export type ExtendedCellSelectProps = ExtendedCellSelectOwnProps & SelectValueProps;

/**
 * {@link ExtendedSelect} with no field around it, for editing a value in place inside a row.
 */
export const ExtendedCellSelect = (props: ExtendedCellSelectProps) => {
	const {
		options,
		onBlur,
		popoverWidth = '18rem',
		searchable = true,
		addNew,
		disabled,
		placeholder = 'Brak',
		ariaLabel,
		title,
		maxVisible,
		className,
	} = props;

	const popover = useSelectPopover({ onBlur, width: popoverWidth, addModeWidth: '22rem' });
	const value = bindSelectValue(props);

	const selectedOptions = options.filter((option) => value.selectedIds.includes(option.id));

	const handleSelect = (optionId: string) => {
		value.toggle(optionId);

		if (!value.isMultiple) {
			popover.close();
		}
	};

	return (
		<SelectCell
			popover={ popover }
			disabled={ disabled }
			ariaLabel={ ariaLabel }
			title={ title }
			className={ className }
			renderValue={ () =>
				selectedOptions.length === 0
					? <span className="truncate text-sm text-os-text-muted">{ placeholder }</span>
					: (
						<ExtendedSelectValue
							options={ selectedOptions }
							multiple={ value.isMultiple }
							maxVisible={ maxVisible }
						/>
					)
			}
		>
			<SelectPanel
				options={ options }
				selectedIds={ value.selectedIds }
				onSelect={ handleSelect }
				onClear={ value.clear }
				clearable
				searchable={ searchable }
				multiple={ value.isMultiple }
				theme="glass"
				addNew={ addNew }
				onModeChange={ (mode) => popover.setIsAddMode(mode === 'add') }
			/>
		</SelectCell>
	);
};
