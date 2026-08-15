import { usePopover } from '@/hooks/usePopover';
import type { SelectValueProps } from '@/components/ui/select';
import { ADD_FORM_WIDTH, bindSelectValue, SelectCell, SelectPanel } from '@/components/ui/select';
import { ExtendedSelectValue } from './ExtendedSelectValue';
import type { ExtendedSelectAddNew, ExtendedSelectOption } from './extendedSelectTypes';


interface ExtendedCellSelectOwnProps {
	options: ExtendedSelectOption[];
	onBlur?: () => void;
	/** Told when the panel opens and closes, so the row around the cell can show it as being edited. */
	onOpenChange?: (open: boolean) => void;
	/** The panel's width. The trigger is usually far too narrow to size it from. */
	popoverWidth?: string;
	searchable?: boolean;
	/** Whether the panel offers to unset the value. Defaults to true. */
	clearable?: boolean;
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
		onOpenChange,
		popoverWidth = '18rem',
		searchable = true,
		clearable = true,
		addNew,
		disabled,
		placeholder = 'Brak',
		ariaLabel,
		title,
		maxVisible,
		className,
	} = props;

	const popover = usePopover({ onBlur, onOpenChange, width: popoverWidth, expandedWidth: ADD_FORM_WIDTH });
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
			state={ popover }
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
				onClear={ clearable ? value.clear : undefined }
				clearable={ clearable }
				searchable={ searchable }
				multiple={ value.isMultiple }
				theme="glass"
				addNew={ addNew }
				onModeChange={ (mode) => popover.setExpanded(mode === 'add') }
			/>
		</SelectCell>
	);
};
