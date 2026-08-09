import type { ReactNode } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useSelectPopover } from '@/hooks/useSelectPopover';
import { SelectPopover } from '@/components/ui/select';
import { Calendar } from './Calendar';
import { formatLongDate, parseISODate } from './dateUtils';

interface DateCellPickerProps {
	/** `YYYY-MM-DD`, or `''` for no date. */
	value: string;
	onChange: (value: string) => void;
	/** Told when the calendar opens and closes, so the row around the cell can show it as edited. */
	onOpenChange?: (open: boolean) => void;
	/** Drawn in place of the formatted date - a column may have its own idea of how one reads. */
	children?: ReactNode;
}

/**
 * {@link DatePicker} with no field around it, for editing a date in place inside a row.
 */
export const DateCellPicker = ({ value, onChange, onOpenChange, children }: DateCellPickerProps) => {
	const popover = useSelectPopover({ onOpenChange, width: '17rem', maxHeight: 400 });
	const { open, setReference, getReferenceProps, close } = popover;

	return (
		<>
			<button
				type="button"
				ref={ setReference }
				aria-haspopup="dialog"
				aria-expanded={ open }
				{ ...getReferenceProps() }
				className="flex w-full cursor-pointer items-center gap-1 rounded-sm text-left text-sm outline-none"
			>
				<span className="truncate">{ children ?? formatLongDate(value) }</span>

				<CalendarIcon size={ 14 } aria-hidden className="ml-auto shrink-0 text-os-text-muted"/>
			</button>

			<SelectPopover popover={ popover }>
				<div role="dialog" aria-label="Kalendarz" className="popover-surface w-full rounded-xl p-3">
					<Calendar
						selected={ parseISODate(value) }
						min={ null }
						max={ null }
						onSelect={ (iso) => {
							onChange(iso);
							close();
						} }
						onDismiss={ close }
					/>
				</div>
			</SelectPopover>
		</>
	);
};
