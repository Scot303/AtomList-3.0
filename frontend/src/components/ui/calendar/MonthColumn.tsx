import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { monthName } from '@/utils/dateUtils.ts';
import { OptionColumn } from './OptionColumn';
import { useOptionCursor } from './useOptionCursor';
import { centeredOffset, isMonthWithin, openIndex, OPTION_GAP, OPTION_HEIGHT } from './calendarOptions';
import { optionClass, type OptionTone } from './calendarStyles';


const MONTH_COUNT = 12;


interface MonthColumnProps {
	year: number;
	/** The month the user has settled on, or `null` while only the pending one is on offer. */
	value: number | null;
	/** The month the calendar opened on, offered until the user picks one of their own. */
	pending: number;
	/** This month, or `null` when the year on show is not the current one. */
	currentMonth: number | null;
	min: Date | null;
	max: Date | null;
	onPick: (month: number) => void;
}


export const MonthColumn = ({ year, value, pending, currentMonth, min, max, onPick }: MonthColumnProps) => {
	const listRef = useRef<HTMLDivElement>(null);

	const [openAt] = useState(() => openIndex(value ?? pending, MONTH_COUNT));

	const { activeIndex, setActiveIndex, handleKeyDown } = useOptionCursor(listRef, MONTH_COUNT, openAt);

	// Twelve rows are taller than the box, so the pending month has to be scrolled to rather than waited for.
	useLayoutEffect(() => {
		listRef.current?.scrollTo({ top: centeredOffset(openAt) });
	}, [openAt]);

	const toneOf = (month: number): OptionTone => {
		if (month === value) {
			return 'selected';
		}

		if (value === null && month === pending) {
			return 'pending';
		}

		return month === currentMonth ? 'current' : 'plain';
	};

	return (
		<OptionColumn label="Miesiąc" listRef={ listRef } onKeyDown={ handleKeyDown }>
			{ Array.from({ length: MONTH_COUNT }, (_, month) => {
				const disabled = !isMonthWithin(year, month, min, max);

				return (
					<button
						key={ month }
						type="button"
						role="option"
						disabled={ disabled }
						aria-selected={ month === value }
						data-active={ month === activeIndex }
						tabIndex={ month === activeIndex ? 0 : -1 }
						onClick={ () => {
							setActiveIndex(month);
							onPick(month);
						} }
						style={ { height: OPTION_HEIGHT - OPTION_GAP, marginBlock: OPTION_GAP / 2 } }
						className={ cn('flex w-full items-center justify-center', optionClass(toneOf(month), disabled)) }
					>
						<span className="truncate px-1">{ monthName(month + 1) }</span>
					</button>
				);
			}) }
		</OptionColumn>
	);
};
