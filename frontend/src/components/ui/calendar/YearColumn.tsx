import { useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/cn';
import { OptionColumn } from './OptionColumn';
import { useOptionCursor } from './useOptionCursor';
import { centeredOffset, openIndex, OPTION_GAP, OPTION_HEIGHT } from './calendarOptions';
import { optionClass, type OptionTone } from './calendarStyles';


const OVERSCAN = 8;


interface YearColumnProps {
	firstYear: number;
	lastYear: number;
	/** The year the user has settled on, or `null` while only the pending one is on offer. */
	value: number | null;
	/** The year the calendar opened on, offered until the user picks one of their own. */
	pending: number;
	currentYear: number;
	onPick: (year: number) => void;
}


export const YearColumn = ({ firstYear, lastYear, value, pending, currentYear, onPick }: YearColumnProps) => {
	'use no memo';

	const listRef = useRef<HTMLDivElement>(null);

	const count = lastYear - firstYear + 1;

	const [openAt] = useState(() => openIndex(( value ?? pending ) - firstYear, count));

	const virtualizer = useVirtualizer({
		count,
		getScrollElement: () => listRef.current,
		estimateSize: () => OPTION_HEIGHT,
		overscan: OVERSCAN,
		initialOffset: centeredOffset(openAt),
	});

	const { activeIndex, setActiveIndex, handleKeyDown } = useOptionCursor(listRef, count, openAt, (index) => {
		virtualizer.scrollToIndex(index);
	});

	/*
	 * `initialOffset` only tells the virtualiser which rows to draw; the box itself still has to be scrolled to them.
	 */
	useLayoutEffect(() => {
		listRef.current?.scrollTo({ top: centeredOffset(openAt) });
	}, [openAt]);

	const toneOf = (year: number): OptionTone => {
		if (year === value) {
			return 'selected';
		}

		if (value === null && year === pending) {
			return 'pending';
		}

		return year === currentYear ? 'current' : 'plain';
	};

	return (
		<OptionColumn label="Rok" listRef={ listRef } onKeyDown={ handleKeyDown }>
			<div role="presentation" style={ { height: virtualizer.getTotalSize(), position: 'relative' } }>
				{ virtualizer.getVirtualItems().map((row) => {
					const year = firstYear + row.index;

					return (
						<button
							key={ row.key }
							type="button"
							role="option"
							aria-selected={ year === value }
							data-active={ row.index === activeIndex }
							tabIndex={ row.index === activeIndex ? 0 : -1 }
							onClick={ () => {
								setActiveIndex(row.index);
								onPick(year);
							} }
							style={ {
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: OPTION_HEIGHT - OPTION_GAP,
								transform: `translateY(${ row.start + OPTION_GAP / 2 }px)`,
							} }
							className={ cn('flex items-center justify-center', optionClass(toneOf(year))) }
						>
							{ year }
						</button>
					);
				}) }
			</div>
		</OptionColumn>
	);
};
