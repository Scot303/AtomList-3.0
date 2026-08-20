import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LOCALE } from '@/lib/locale';
import { addDays, addMonths, dateToISO, daysInMonth, isSameDay, isWithin, leadingBlanks, MONTH_NAMES, todayInTimeZone, WEEKDAY_NAMES, } from '@/utils/dateUtils.ts';


/** Years shown at once in the year grid. */
const YEAR_PAGE = 12;


interface CalendarProps {
	/** The currently selected date, or null when nothing is chosen. */
	selected: Date | null;
	min: Date | null;
	max: Date | null;
	onSelect: (iso: string) => void;
	onDismiss: () => void;
}


/**
 * A month grid with keyboard navigation.
 *
 * Arrow keys move a day at a time, up and down a week, PageUp/PageDown a month,
 * Home and End to the ends of the week; Enter or Space picks.
 */
export const Calendar = ({ selected, min, max, onSelect, onDismiss }: CalendarProps) => {
	const [today] = useState(todayInTimeZone);

	const [focused, setFocused] = useState<Date>(selected ?? today);
	const [pickingYear, setPickingYear] = useState(false);
	const gridRef = useRef<HTMLDivElement>(null);

	const year = focused.getFullYear();
	const month = focused.getMonth();

	// The focused day owns the only tab stop, so focus has to follow it as it moves.
	useEffect(() => {
		if (pickingYear) {
			return;
		}

		gridRef.current?.querySelector<HTMLButtonElement>('[data-focused="true"]')?.focus();
	}, [focused, pickingYear]);

	const move = (next: Date) => {
		if (isWithin(next, min, max)) {
			setFocused(next);
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

	if (pickingYear) {
		// Anchored so the current view year keeps its position as the pages move.
		const start = year - ( ( year - today.getFullYear() + YEAR_PAGE * 100 ) % YEAR_PAGE );
		const years = Array.from({ length: YEAR_PAGE }, (_, offset) => start + offset);

		return (
			<div>
				<div className="mb-3 flex items-center justify-between">
					<NavButton label="Wcześniejsze lata" onClick={ () => setFocused(addMonths(focused, -12 * YEAR_PAGE)) }>
						<ChevronLeft size={ 16 }/>
					</NavButton>

					<span className="text-sm font-semibold text-os-text">
						{ years[0] }–{ years[years.length - 1] }
					</span>

					<NavButton label="Późniejsze lata" onClick={ () => setFocused(addMonths(focused, 12 * YEAR_PAGE)) }>
						<ChevronRight size={ 16 }/>
					</NavButton>
				</div>

				<div className="grid grid-cols-4 gap-1">
					{ years.map((candidate) => (
						<button
							key={ candidate }
							type="button"
							onClick={ () => {
								setFocused(new Date(candidate, month, Math.min(focused.getDate(), daysInMonth(candidate, month))));
								setPickingYear(false);
							} }
							className={ cn(
								'h-8 rounded-lg text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-os-primary',
								candidate === selected?.getFullYear()
									? 'bg-os-primary font-semibold text-white'
									: candidate === today.getFullYear()
										? 'border border-os-primary text-os-primary'
										: 'text-os-text hover:bg-white/3 hover:ring-1 ring-os-primary/30 ring-inset',
							) }
						>
							{ candidate }
						</button>
					)) }
				</div>
			</div>
		);
	}

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
		<div>
			<div className="mb-3 flex items-center justify-between">
				<NavButton label="Poprzedni miesiąc" onClick={ () => setFocused(addMonths(focused, -1)) }>
					<ChevronLeft size={ 16 }/>
				</NavButton>

				<button
					type="button"
					onClick={ () => setPickingYear(true) }
					className="rounded-lg px-2 py-1 text-sm font-semibold text-os-text transition-colors outline-none hover:bg-white/4 hover:text-os-primary focus-visible:text-os-primary"
				>
					{ MONTH_NAMES[month] } { year }
				</button>

				<NavButton label="Następny miesiąc" onClick={ () => setFocused(addMonths(focused, 1)) }>
					<ChevronRight size={ 16 }/>
				</NavButton>
			</div>

			<div aria-hidden className="mb-1 grid grid-cols-7">
				{ WEEKDAY_NAMES.map((name) => (
					<div key={ name } className="py-1 text-center text-xs font-medium text-os-text-muted">{ name }</div>
				)) }
			</div>

			{ /* The grid owns the key handling; its cells share a single tab stop. */ }
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
									'h-8 w-8 rounded-lg text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-os-primary',
									isSelected
										? 'bg-os-primary font-semibold text-white'
										: isToday
											? 'border border-os-primary text-os-primary'
											: 'text-os-text hover:bg-white/3 hover:ring-1 ring-os-primary/30 ring-inset',
									disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
								) }
							>
								{ day }
							</button>
						</div>
					);
				}) }
			</div>
		</div>
	);
};

const NavButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
	<button
		type="button"
		aria-label={ label }
		onClick={ onClick }
		className="rounded-lg p-1.5 text-os-text-muted transition-colors outline-none hover:bg-white/4 hover:text-os-primary focus-visible:text-os-primary"
	>
		{ children }
	</button>
);
