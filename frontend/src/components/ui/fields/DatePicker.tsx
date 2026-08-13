import { useId } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePopover } from '@/hooks/usePopover';
import { Popover } from '@/components/ui/popover';
import { Calendar } from './Calendar';
import { FieldShell } from './FieldShell';
import { formatLongDate, parseISODate } from './dateUtils';
import { fieldControl, fieldControlWithLeftIcon, fieldLeftIcon, type FieldSize, } from './fieldStyles';


interface DatePickerProps {
	/** Omit, or pass `''`, for an inline picker with no room for a label. */
	label?: string;
	/** `YYYY-MM-DD`, or `''` for no date. */
	value: string;
	onChange: (value: string) => void;
	/** Called when the panel closes, whether or not a date was picked. */
	onBlur?: () => void;
	error?: string;
	hint?: string;
	className?: string;
	disabled?: boolean;
	min?: string;
	max?: string;
	size?: FieldSize;
}

/**
 * A date field that opens a calendar.
 */
export const DatePicker = (props: DatePickerProps) => {
	const { label, value, onChange, onBlur, error, hint, className, disabled, min, max, size = 'default' } = props;

	const id = useId();

	const popover = usePopover({ width: '17rem', maxHeight: 400, onBlur });
	const { open, setReference, getReferenceProps, close } = popover;

	const selected = parseISODate(value);
	const display = formatLongDate(value);

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
				ref={ setReference }
				type="button"
				disabled={ disabled }
				aria-haspopup="dialog"
				aria-expanded={ open }
				aria-invalid={ error ? true : undefined }
				{ ...getReferenceProps() }
				className={ cn(
					'peer block text-left',
					fieldControl(size, { hasError: Boolean(error), disabled, active: open }),
					fieldControlWithLeftIcon[size],
				) }
			>
				<span className={ cn('block min-h-5 truncate', display === '' && 'text-os-text-muted') }>
					{ display === '' ? 'Wybierz datę' : display }
				</span>
			</button>

			<div className={ fieldLeftIcon(size, { hasError: Boolean(error), active: open }) }>
				<CalendarIcon size={ size === 'sm' ? 14 : 18 }/>
			</div>

			<Popover state={ popover }>
				<div role="dialog" aria-label={ label || 'Kalendarz' } className="popover-surface w-full rounded-xl p-3">
					<Calendar
						selected={ selected }
						min={ parseISODate(min ?? '') }
						max={ parseISODate(max ?? '') }
						onSelect={ (iso) => {
							onChange(iso);
							close();
						} }
						onDismiss={ close }
					/>
				</div>
			</Popover>
		</FieldShell>
	);
};
