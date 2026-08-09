import type { ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SelectPopoverState } from '@/hooks/useSelectPopover';
import { FieldShell } from '@/components/ui/fields/FieldShell';
import { fieldControl, fieldControlWithLeftIcon, fieldControlWithRightAdornment, fieldLeftIcon, fieldRightAdornment, } from '@/components/ui/fields/fieldStyles';
import { SelectPopover } from './SelectPopover';
import type { SelectSize } from './selectTypes';

interface SelectFieldProps {
	popover: SelectPopoverState;
	/** The panel to show when it opens. */
	children: ReactNode;
	renderValue: () => ReactNode;
	hasValue: boolean;
	id?: string;
	label?: string;
	error?: string;
	hint?: string;
	size?: SelectSize;
	leftIcon?: ReactNode;
	placeholder?: string;
	disabled?: boolean;
	clearable?: boolean;
	onClear?: () => void;
	className?: string;
}

/**
 * A select drawn as a form field.
 *
 * Shares its style with the rest of the field kit through {@link FieldShell} and `fieldStyles`.
 */
export const SelectField = (props: SelectFieldProps) => {
	const {
		popover,
		children,
		renderValue,
		hasValue,
		id,
		label,
		error,
		hint,
		size = 'default',
		leftIcon,
		placeholder = 'Wybierz…',
		disabled,
		clearable,
		onClear,
		className,
	} = props;

	const { open, setReference, getReferenceProps } = popover;

	const showClear = clearable === true && hasValue && !disabled && onClear !== undefined;

	return (
		<FieldShell
			htmlFor={ id }
			label={ label }
			error={ error }
			hint={ hint }
			size={ size }
			disabled={ disabled }
			className={ className }
		>
			<button
				id={ id }
				type="button"
				ref={ setReference }
				disabled={ disabled }
				aria-haspopup="listbox"
				aria-expanded={ open }
				aria-invalid={ error ? true : undefined }
				{ ...getReferenceProps() }
				className={ cn(
					'peer text-left',
					fieldControl(size, { hasError: Boolean(error), disabled, active: open }),
					leftIcon && fieldControlWithLeftIcon[size],
					// Room for the chevron, plus the clear button when it is showing.
					showClear ? (size === 'sm' ? 'pr-14' : 'pr-16') : fieldControlWithRightAdornment[size],
				) }
			>
				{ hasValue ? renderValue() : <span className="text-os-text-muted">{ placeholder }</span> }
			</button>

			{ leftIcon && (
				<div className={ fieldLeftIcon(size, { hasError: Boolean(error), active: open }) }>
					{ leftIcon }
				</div>
			) }

			<div className={ cn(fieldRightAdornment(size), 'pointer-events-none') }>
				{ showClear && (
					<button
						type="button"
						tabIndex={ -1 }
						title="Wyczyść"
						aria-label="Wyczyść"
						onMouseDown={ (event) => {
							// Stops the trigger beneath from reading this as a request to open.
							event.preventDefault();
							event.stopPropagation();
							onClear();
						} }
						className="pointer-events-auto mr-1 text-os-text-muted transition-colors hover:text-os-text"
					>
						<X size={ size === 'sm' ? 14 : 16 }/>
					</button>
				) }

				<span
					aria-hidden
					className={ cn(
						'transition-all duration-200',
						open ? 'rotate-180 text-os-primary' : 'text-os-text-muted',
					) }
				>
					<ChevronDown size={ size === 'sm' ? 16 : 18 }/>
				</span>
			</div>

			<SelectPopover popover={ popover }>{ children }</SelectPopover>
		</FieldShell>
	);
};
