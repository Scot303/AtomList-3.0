import { useId } from 'react';
import { Switch } from '@headlessui/react';
import { cn } from '@/lib/cn';
import { fieldFocusRing, type FieldSize } from './fieldStyles';

interface ToggleProps {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	description?: string;
	disabled?: boolean;
	/** Puts the switch first and the label beside it, for a compact row. */
	compact?: boolean;
	size?: FieldSize;
	className?: string;
}

/**
 * An on/off switch with its label.
 */
export const Toggle = (props: ToggleProps) => {
	const { label, checked, onChange, description, disabled, compact, size = 'default', className } = props;

	const id = useId();
	const small = size === 'sm';

	return (
		<div
			className={ cn(
				'flex items-center py-1',
				compact ? 'flex-row-reverse justify-end gap-3' : 'justify-between',
				disabled && 'opacity-70',
				className,
			) }
		>
			<label htmlFor={ id } className={ cn('flex flex-col', !disabled && 'cursor-pointer') }>
				<span className={ cn('font-medium text-os-text-muted', small ? 'text-xs' : 'text-sm') }>{ label }</span>
				{ description && <span className="text-xs text-os-text-muted">{ description }</span> }
			</label>

			<Switch
				id={ id }
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
				className={ cn(
					'relative inline-flex shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none',
					'focus-visible:ring-2',
					fieldFocusRing,
					checked ? 'bg-os-primary' : 'bg-os-border',
					disabled ? 'cursor-not-allowed' : 'cursor-pointer',
					small ? 'h-5 w-9' : 'h-6 w-11',
				) }
			>
				<span
					aria-hidden
					className={ cn(
						'pointer-events-none inline-block transform rounded-full bg-os-text/85 shadow ring-0 transition duration-200 ease-in-out',
						checked ? (small ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0',
						small ? 'h-4 w-4' : 'h-5 w-5',
					) }
				/>
			</Switch>
		</div>
	);
};
