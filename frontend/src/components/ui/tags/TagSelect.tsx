import type React from 'react';
import { useId } from 'react';
import { usePopover } from '@/hooks/usePopover';
import type { SelectAddNew, SelectSize, SelectValueProps } from '@/components/ui/select';
import { ADD_FORM_WIDTH, bindSelectValue, SelectField, SelectPanel } from '@/components/ui/select';
import { TagBadge } from './TagBadge';
import { buildTagPanelOptions } from './tagPanelOptions';
import type { TagOption } from './tagTypes';


interface TagSelectOwnProps {
	options: TagOption[];
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
	addNew?: SelectAddNew;
}


export type TagSelectProps = TagSelectOwnProps & SelectValueProps;

/**
 * {@link '@/components/ui/extendedSelect'.ExtendedSelect} for tags: every option, and the value in the trigger, is drawn as its badge.
 */
export const TagSelect = (props: TagSelectProps) => {
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
		addNew,
	} = props;

	const id = useId();
	const popover = usePopover({ onBlur, width: 'trigger', expandedWidth: ADD_FORM_WIDTH });
	const value = bindSelectValue(props);

	const panel = buildTagPanelOptions(options);
	const selectedTags = options.filter((option) => value.selectedIds.includes(option.id));
	const hasValue = selectedTags.length > 0;

	const handleSelect = (optionId: string) => {
		value.toggle(optionId);

		if (!value.isMultiple) {
			popover.close();
		}
	};

	return (
		<SelectField
			state={ popover }
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
			hasValue={ hasValue }
			renderValue={ () => (
				<span className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
					{ selectedTags.map((tag) => (
						<TagBadge key={ tag.id } label={ tag.name } color={ tag.color } size={ size }/>
					)) }
				</span>
			) }
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
				theme="modal"
				addNew={ addNew }
				onModeChange={ (mode) => popover.setExpanded(mode === 'add') }
			/>
		</SelectField>
	);
};
