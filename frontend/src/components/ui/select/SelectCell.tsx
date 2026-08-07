import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { SelectPopoverState } from '@/hooks/useSelectPopover';
import { SelectPopover } from './SelectPopover';

interface SelectCellProps {
	popover: SelectPopoverState;
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
	const { popover, children, renderValue, disabled, ariaLabel, title, className } = props;

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
					'inline-flex max-w-full items-center gap-0.5 rounded-full text-left focus:outline-none',
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
							'shrink-0 transition-all duration-200 ml-0.5 text-os-text-muted',
							open ? 'rotate-180' : '',
						) }
					/>
				) }
			</button>

			<SelectPopover popover={ popover }>{ children }</SelectPopover>
		</>
	);
};
