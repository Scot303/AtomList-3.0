import type { ReactNode } from 'react';
import { AlertCircle, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SelectPopoverState } from '@/hooks/useSelectPopover';
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
	size?: SelectSize;
	leftIcon?: ReactNode;
	placeholder?: string;
	disabled?: boolean;
	clearable?: boolean;
	onClear?: () => void;
	className?: string;
}

export const SelectField = (props: SelectFieldProps) => {
	const {
		popover,
		children,
		renderValue,
		hasValue,
		id,
		label,
		error,
		size = 'default',
		leftIcon,
		placeholder = 'Wybierz…',
		disabled,
		clearable,
		onClear,
		className,
	} = props;

	// See the note in SelectPopover on why these are pulled out rather than read off `popover` below.
	const { open, setReference, getReferenceProps } = popover;

	const showClear = clearable === true && hasValue && !disabled && onClear !== undefined;

	return (
		<div className={ cn('w-full', disabled && 'opacity-70', className) }>
			{ size !== 'sm' && label && (
				<label
					htmlFor={ id }
					className={ cn(
						'mb-1.5 block px-1 text-sm font-medium tracking-wide',
						error ? 'text-os-error' : 'text-os-text',
					) }
				>
					{ label }
				</label>
			) }

			<div className="relative">
				<button
					id={ id }
					type="button"
					ref={ setReference }
					disabled={ disabled }
					aria-haspopup="listbox"
					aria-expanded={ open }
					{ ...getReferenceProps() }
					className={ cn(
						'w-full appearance-none border bg-os-surface text-left text-sm transition-all outline-none',
						size === 'sm' ? 'rounded-lg py-1.5 pl-3' : 'rounded-xl py-2.5 pl-4',
						leftIcon && (size === 'sm' ? 'pl-8' : 'pl-12'),
						showClear ? (size === 'sm' ? 'pr-14' : 'pr-16') : size === 'sm' ? 'pr-8' : 'pr-10',
						open ? 'border-os-primary' : error ? 'border-os-error' : 'border-os-border',
						disabled && 'cursor-not-allowed',
					) }
				>
					{ hasValue ? renderValue() : <span className="text-os-text-muted">{ placeholder }</span> }
				</button>

				{ leftIcon && (
					<div
						className={ cn(
							'pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors',
							size === 'sm' ? 'left-2.5' : 'left-4',
							open ? 'text-os-primary' : 'text-os-text-muted',
						) }
					>
						{ leftIcon }
					</div>
				) }

				<div
					className={ cn(
						'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-1',
						size === 'sm' ? 'right-3' : 'right-4',
					) }
				>
					{ showClear && (
						<button
							type="button"
							tabIndex={ -1 }
							title="Wyczyść"
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
						className={ cn(
							'transition-all duration-200',
							open ? 'rotate-180 text-os-primary' : 'text-os-text-muted',
						) }
					>
						<ChevronDown size={ size === 'sm' ? 16 : 18 }/>
					</span>
				</div>
			</div>

			{ error && (
				<p className="mt-2 flex items-center gap-1.5 pl-2 text-sm font-medium text-os-error">
					<AlertCircle size={ 16 } className="shrink-0"/> { error }
				</p>
			) }

			<SelectPopover popover={ popover }>{ children }</SelectPopover>
		</div>
	);
};
