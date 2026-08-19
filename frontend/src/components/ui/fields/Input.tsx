import * as React from 'react';
import { type ReactNode, type Ref, useId, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FieldShell } from './FieldShell';
import { fieldControl, fieldControlWithLeftIcon, fieldLeftIcon, fieldRightAdornment, type FieldSize } from './fieldStyles';


interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label: string;
	error?: string;
	hint?: string;
	icon?: ReactNode;
	size?: FieldSize;
	ref?: Ref<HTMLInputElement>;
}


export const Input = (props: InputProps) => {
	const { className, label, error, hint, icon, size = 'default', disabled, ref, ...rest } = props;

	const id = useId();
	const innerRef = useRef<HTMLInputElement>(null);
	const isNumber = rest.type === 'number';

	const setRef = (element: HTMLInputElement | null) => {
		innerRef.current = element;

		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	};

	const stepBy = (input: HTMLInputElement | null, direction: 'up' | 'down') => {
		if (direction === 'up') {
			input?.stepUp();
		} else {
			input?.stepDown();
		}

		// React does not see `stepUp`, so the change has to be announced for `onChange` to fire.
		input?.dispatchEvent(new Event('input', { bubbles: true }));
	};

	const stepUp = (event: React.MouseEvent) => {
		event.preventDefault();

		if (!disabled) {
			stepBy(innerRef.current, 'up');
		}
	};

	const stepDown = (event: React.MouseEvent) => {
		event.preventDefault();

		if (!disabled) {
			stepBy(innerRef.current, 'down');
		}
	};

	return (
		<FieldShell htmlFor={ id } label={ label } error={ error } hint={ hint } size={ size } disabled={ disabled }>
			<input
				id={ id }
				ref={ setRef }
				disabled={ disabled }
				aria-invalid={ error ? true : undefined }
				{ ...rest }
				className={ cn(
					'peer',
					fieldControl(size, { hasError: Boolean(error), disabled }),
					icon && fieldControlWithLeftIcon[size],
					isNumber && ( size === 'sm' ? 'pr-7' : 'pr-8' ),
					className,
				) }
			/>

			{ icon && (
				<div className={ fieldLeftIcon(size, { hasError: Boolean(error) }) }>
					{ icon }
				</div>
			) }

			{ isNumber && (
				<div className={ cn(fieldRightAdornment(size), 'flex-col gap-0') }>
					<button
						type="button"
						tabIndex={ -1 }
						aria-hidden
						onMouseDown={ stepUp }
						className={ cn(
							'flex items-center justify-center rounded-t text-os-text transition-colors hover:text-os-primary',
							size === 'sm' ? 'h-3 w-4' : 'h-5 w-5',
						) }
					>
						<ChevronUp size={ size === 'sm' ? 10 : 12 } strokeWidth={ 2.5 }/>
					</button>

					<button
						type="button"
						tabIndex={ -1 }
						aria-hidden
						onMouseDown={ stepDown }
						className={ cn(
							'flex items-center justify-center rounded-b text-os-text transition-colors hover:text-os-primary',
							size === 'sm' ? 'h-3 w-4' : 'h-5 w-5',
						) }
					>
						<ChevronDown size={ size === 'sm' ? 10 : 12 } strokeWidth={ 2.5 }/>
					</button>
				</div>
			) }
		</FieldShell>
	);
};
