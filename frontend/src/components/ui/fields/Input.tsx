import * as React from 'react';
import { forwardRef, type ReactNode, useCallback, useId, useRef } from 'react';
import { cn } from '@/lib/cn.ts';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label: string;
	error?: string;
	icon?: ReactNode;
	size?: 'sm' | 'default';
}


export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, label, error, icon, size = 'default', disabled, ...props }, ref) => {

		const id = useId();
		const innerRef = useRef<HTMLInputElement>(null);
		const isNumber = props.type === 'number';

		const setRef = useCallback((el: HTMLInputElement | null) => {
			(innerRef as React.RefObject<HTMLInputElement | null>).current = el;
			if (typeof ref === 'function') ref(el);
			else if (ref) (ref as React.RefObject<HTMLInputElement | null>).current = el;
		}, [ref]);

		return (
			<div className={ cn('w-full', disabled && 'opacity-70') }>
				{ size !== 'sm' && (
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
					<input
						id={ id }
						ref={ setRef }
						disabled={ disabled }
						{ ...props }
						className={ cn(
							'text-sm peer w-full appearance-none focus:outline-none focus:ring-0 bg-os-surface',
							'border transition-all text-os-text',
							size === 'sm' ? 'px-3 py-1.5 rounded-lg' : 'px-2.5 py-2.5 rounded-xl',
							size === 'sm' ? (icon ? 'pl-8' : '') : icon ? 'pl-12' : 'pl-4',
							isNumber ? 'pr-7' : '',
							error
								? 'border-os-error focus:border-os-error'
								: 'border-os-border focus:border-os-primary',
							className,
						) }
					/>

					{ isNumber && (
						<div
							className={ cn(
								'absolute top-1/2 -translate-y-1/2 flex flex-col',
								size === 'sm' ? 'right-3' : 'right-4',
							) }
						>
							<button
								type="button"
								tabIndex={ -1 }
								onMouseDown={ (e) => {
									e.preventDefault();
									if (disabled) return;

									innerRef.current?.stepUp();
									innerRef.current?.dispatchEvent(
										new Event('input', { bubbles: true }),
									);
								} }
								className={ cn(
									'flex items-center justify-center rounded-t text-os-text hover:text-os-primary transition-colors',
									size === 'sm' ? 'h-3 w-4' : 'h-5 w-5',
								) }
							>
								<ChevronUp size={ size === 'sm' ? 10 : 12 } strokeWidth={ 2.5 }/>
							</button>
							<button
								type="button"
								tabIndex={ -1 }
								onMouseDown={ (e) => {
									e.preventDefault();
									if (disabled) return;

									innerRef.current?.stepDown();
									innerRef.current?.dispatchEvent(
										new Event('input', { bubbles: true }),
									);
								} }
								className={ cn(
									'flex items-center justify-center rounded-b text-os-text hover:text-os-primary transition-colors',
									size === 'sm' ? 'h-3 w-4' : 'h-5 w-5',
								) }
							>
								<ChevronDown size={ size === 'sm' ? 10 : 12 } strokeWidth={ 2.5 }/>
							</button>
						</div>
					) }

					{ icon && (
						<div
							className={ cn(
								'absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200',
								error ? 'text-os-error' : 'text-os-text peer-focus:text-os-primary',
							) }
						>
							{ icon }
						</div>
					) }
				</div>

				{ error && (
					<p className="mt-2 flex items-center gap-1.5 pl-2 text-sm font-medium text-os-error">
						<AlertCircle size={ 16 } className="shrink-0"/> { error }
					</p>
				) }
			</div>
		);
	},
);
