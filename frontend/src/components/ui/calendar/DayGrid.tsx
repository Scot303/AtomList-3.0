import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { LOCALE } from '@/lib/locale';
import { addDays, addMonths, dateToISO, daysInMonth, isSameDay, isWithin, leadingBlanks, WEEKDAY_NAMES, } from '@/utils/dateUtils.ts';
import { optionClass } from './calendarStyles';


interface DayGridProps {
	today: Date;
	focused: Date;
	onFocusedChange: (date: Date) => void;
	selected: Date | null;
	min: Date | null;
	max: Date | null;
	onSelect: (iso: string) => void;
	onDismiss: () => void;
}


/**
 * One month of days, with keyboard navigation.
 *
 * Arrow keys move a day at a time, up and down a week, PageUp/PageDown a month,
 * Home and End to the ends of the week; Enter or Space picks.
 */
export const DayGrid = ({ today, focused, onFocusedChange, selected, min, max, onSelect, onDismiss }: DayGridProps) => {
	const gridRef = useRef<HTMLDivElement>(null);

	const year = focused.getFullYear();
	const month = focused.getMonth();

	// The focused day owns the only tab stop, so focus has to follow it as it moves.
	useEffect(() => {
		gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
	}, [focused]);

	const move = (next: Date) => {
		if (isWithin(next, min, max)) {
			onFocusedChange(next);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		const moves: Record<string, () => Date> = {
			ArrowLeft: () => addDays(focused, -1),
			ArrowRight: () => addDays(focused, 1),
			ArrowUp: () => addDays(focused, -7),
			ArrowDown: () => addDays(focused, 7),
			PageUp: () => addMonths(focused, -1),
			PageDown: () => addMonths(focused, 1),
			Home: () => addDays(focused, -leadingBlanks(year, month) - focused.getDate() + 1),
			End: () => addDays(focused, daysInMonth(year, month) - focused.getDate()),
		};

		if (event.key in moves) {
			event.preventDefault();
			move(moves[event.key]());
			return;
		}

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();

			if (isWithin(focused, min, max)) {
				onSelect(dateToISO(focused));
			}

			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			onDismiss();
		}
	};

	const blanks = leadingBlanks(year, month);
	const total = daysInMonth(year, month);
	const cells: ( number | null )[] = [
		...Array<null>(blanks).fill(null),
		...Array.from({ length: total }, (_, index) => index + 1),
	];
	while (cells.length % 7 !== 0) {
		cells.push(null);
	}

	const dayFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'full' });

	return (
		<>
			<div aria-hidden className="mb-1 grid grid-cols-7">
				{ WEEKDAY_NAMES.map((name) => (
					<div key={ name } className="py-1 text-center text-xs font-medium text-os-text-muted">{ name }</div>
				)) }
			</div>

			<div
				ref={ gridRef }
				role="grid"
				onKeyDown={ handleKeyDown }
				className="grid grid-cols-7 gap-y-0.5"
			>
				{ cells.map((day, index) => {
					if (day === null) {
						return <div key={ `blank-${ index }` } role="presentation"/>;
					}

					const date = new Date(year, month, day);
					const disabled = !isWithin(date, min, max);
					const isSelected = selected !== null && isSameDay(date, selected);
					const isToday = isSameDay(date, today);

					return (
						<div key={ day } role="gridcell" className="flex justify-center">
							<button
								type="button"
								disabled={ disabled }
								data-focused={ isSameDay(date, focused) }
								tabIndex={ isSameDay(date, focused) ? 0 : -1 }
								aria-label={ dayFormat.format(date) }
								aria-current={ isToday ? 'date' : undefined }
								aria-selected={ isSelected }
								onClick={ () => onSelect(dateToISO(date)) }
								className={ cn(
									'h-8 w-8',
									optionClass(isSelected ? 'selected' : isToday ? 'current' : 'plain', disabled),
								) }
							>
								{ day }
							</button>
						</div>
					);
				}) }
			</div>
		</>
	);
};
