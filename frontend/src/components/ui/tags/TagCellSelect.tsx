import { usePopover } from '@/hooks/usePopover';
import type { SelectAddNew, SelectValueProps } from '@/components/ui/select';
import { ADD_FORM_WIDTH, bindSelectValue, SelectCell, SelectPanel } from '@/components/ui/select';
import { TagBadge } from './TagBadge';
import { buildTagPanelOptions } from './tagPanelOptions';
import type { TagOption } from './tagTypes';


interface TagCellSelectOwnProps {
	options: TagOption[];
	onBlur?: () => void;
	/** Told when the panel opens and closes, so the row around the cell can show it as being edited. */
	onOpenChange?: (open: boolean) => void;
	/** The panel's width. A badge is far too narrow to size it from. */
	popoverWidth?: string;
	searchable?: boolean;
	clearable?: boolean;
	addNew?: SelectAddNew;
	disabled?: boolean;
	/** Shown in place of a badge when nothing is selected. */
	placeholder?: string;
	ariaLabel?: string;
	/** Hover text. Worth setting alongside `disabled`, to say why it cannot be changed. */
	title?: string;
	className?: string;
}

export type TagCellSelectProps = TagCellSelectOwnProps & SelectValueProps;

/**
 * A badge that opens a tag panel when clicked - for changing a value in place inside a row without a form control standing in for it.
 */
export const TagCellSelect = (props: TagCellSelectProps) => {
	const {
		options,
		onBlur,
		onOpenChange,
		popoverWidth = '16rem',
		searchable = false,
		clearable = false,
		addNew,
		disabled,
		placeholder = 'Brak',
		ariaLabel,
		title,
		className,
	} = props;

	const popover = usePopover({ onBlur, onOpenChange, width: popoverWidth, expandedWidth: ADD_FORM_WIDTH });
	const value = bindSelectValue(props);

	const panel = buildTagPanelOptions(options);
	const selectedTags = options.filter((option) => value.selectedIds.includes(option.id));

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
				selectedTags.length === 0
					? <span className="truncate text-sm text-os-text-muted">{ placeholder }</span>
					: (
						<span className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
							{ selectedTags.map((tag) => (
								<TagBadge key={ tag.id } label={ tag.name } color={ tag.color }/>
							)) }
						</span>
					)
			}
		>
			<SelectPanel
				options={ panel.options }
				renderOption={ panel.renderOption }
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
