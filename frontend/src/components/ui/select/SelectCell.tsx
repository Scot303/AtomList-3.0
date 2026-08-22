import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PopoverState } from '@/hooks/usePopover';
import { Popover } from '@/components/ui/popover';


interface SelectCellProps {
	state: PopoverState;
	/** The panel to show when it opens. */
	children: ReactNode;
	/** Draws the whole trigger - a badge, a row of chips, whatever the cell shows when closed. */
	renderValue: () => ReactNode;
	disabled?: boolean;
	ariaLabel?: string;
	title?: string;
	className?: string;
}


/**
 * A select with no field around it: the value itself is the trigger.
 */
export const SelectCell = (props: SelectCellProps) => {
	const { state: popover, children, renderValue, disabled, ariaLabel, title, className } = props;

	const { open, setReference, getReferenceProps } = popover;

	return (
		<>
			<button
				type="button"
				ref={ setReference }
				disabled={ disabled }
				aria-label={ ariaLabel }
				aria-haspopup="listbox"
				aria-expanded={ open }
				title={ title }
				{ ...getReferenceProps() }
				className={ cn(
					'inline-flex min-h-6 max-w-full items-center gap-1 rounded-full text-left focus:outline-none',
					disabled ? 'cursor-default' : 'cursor-pointer',
					className,
				) }
			>
				{ renderValue() }

				{ !disabled && (
					<ChevronDown
						size={ 14 }
						aria-hidden
						className={ cn(
							'ml-auto shrink-0 transition-all duration-200 text-os-text-muted',
							open ? 'rotate-180' : '',
						) }
					/>
				) }
			</button>

			<Popover state={ popover }>{ children }</Popover>
		</>
	);
};
