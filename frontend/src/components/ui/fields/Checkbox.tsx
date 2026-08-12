import type React from 'react';
import { type Ref, useCallback, useEffect, useId, useRef } from 'react';
import { AlertCircle, Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fieldError, fieldErrorIconSize, fieldFocusRing, type FieldSize } from './fieldStyles';


interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
	label?: string;
	error?: string;
	size?: FieldSize;
	/**
	 * Neither checked nor unchecked - for a "select all" that only some of its children follow.
	 * Overrides how `checked` is drawn, but not what `checked` reports.
	 */
	indeterminate?: boolean;
	ref?: Ref<HTMLInputElement>;
}

/**
 * A checkbox drawn from a hidden native input, so it keeps real checkbox semantics and keyboard behavior while the box beside it can be styled.
 */
export const Checkbox = (props: CheckboxProps) => {
	const { className, label, error, size = 'default', indeterminate = false, disabled, checked, ref, ...rest } = props;

	const id = useId();
	const innerRef = useRef<HTMLInputElement>(null);
	const small = size === 'sm';

	const setRef = useCallback((element: HTMLInputElement | null) => {
		innerRef.current = element;

		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	}, [ref]);

	// `indeterminate` exists only on the DOM node; there is no attribute for it.
	useEffect(() => {
		if (innerRef.current) {
			innerRef.current.indeterminate = indeterminate;
		}
	}, [indeterminate]);

	const filled = indeterminate || checked === true;

	return (
		<div className="inline-flex flex-col">
			<div className={ cn('inline-flex items-center gap-2', disabled && 'opacity-70', className) }>
				<label
					htmlFor={ id }
					className={ cn(
						'group relative inline-flex items-center justify-center',
						disabled ? 'cursor-not-allowed' : 'cursor-pointer',
					) }
				>
					<input
						id={ id }
						ref={ setRef }
						type="checkbox"
						disabled={ disabled }
						checked={ checked }
						aria-invalid={ error ? true : undefined }
						className="peer sr-only"
						{ ...rest }
					/>

					<div
						className={ cn(
							'flex items-center justify-center rounded border transition-all duration-150',
							small ? 'h-4 w-4' : 'h-5 w-5',
							// The real input is `sr-only`, so the browser's focus ring lands on something invisible. Without this, a keyboard user cannot see where they are.
							'peer-focus-visible:ring-2',
							fieldFocusRing,
							filled
								? 'border-os-primary bg-os-primary/85'
								: error
									? 'border-os-error bg-os-surface'
									: 'border-os-border bg-os-surface',
							!disabled && !filled && 'group-hover:border-os-primary/60',
						) }
					>
						{ indeterminate ? (
							<Minus strokeWidth={ 3 } className={ cn('text-white', small ? 'h-2.5 w-2.5' : 'h-3 w-3') }/>
						) : (
							<Check
								strokeWidth={ 3 }
								className={ cn(
									'text-white transition-opacity duration-150',
									small ? 'h-2.5 w-2.5' : 'h-3 w-3',
									checked ? 'opacity-100' : 'opacity-0',
								) }
							/>
						) }
					</div>
				</label>

				{ label && (
					<label
						htmlFor={ id }
						className={ cn(
							'select-none font-medium tracking-wide text-os-text-muted',
							small ? 'text-xs' : 'text-sm',
							disabled ? 'cursor-not-allowed' : 'cursor-pointer',
						) }
					>
						{ label }
					</label>
				) }
			</div>

			{ error && (
				<p className={ fieldError }>
					<AlertCircle size={ fieldErrorIconSize } className="shrink-0"/> { error }
				</p>
			) }
		</div>
	);
};
