import { useState } from 'react';
import { addMonths, daysInMonth, MONTH_NAMES, todayInTimeZone } from '@/utils/dateUtils.ts';
import { CalendarHeader } from './CalendarHeader';
import { DayGrid } from './DayGrid';
import { YearMonthPicker } from './YearMonthPicker';


interface CalendarProps {
	selected: Date | null;
	min: Date | null;
	max: Date | null;
	onSelect: (iso: string) => void;
	onDismiss: () => void;
}


export const Calendar = ({ selected, min, max, onSelect, onDismiss }: CalendarProps) => {
	const [today] = useState(todayInTimeZone);

	const [focused, setFocused] = useState<Date>(selected ?? today);
	const [picking, setPicking] = useState(false);

	const year = focused.getFullYear();
	const month = focused.getMonth();

	return (
		<div>
			<CalendarHeader
				title={ `${ MONTH_NAMES[month] } ${ year }` }
				picking={ picking }
				onTogglePicking={ () => setPicking(!picking) }
				onStepMonth={ (offset) => setFocused(addMonths(focused, offset)) }
			/>

			{ picking ? (
				<YearMonthPicker
					today={ today }
					pendingYear={ year }
					pendingMonth={ month }
					min={ min }
					max={ max }
					onPick={ (nextYear, nextMonth) => {
						setFocused(new Date(nextYear, nextMonth, Math.min(focused.getDate(), daysInMonth(nextYear, nextMonth))));
						setPicking(false);
					} }
				/>
			) : (
				<DayGrid
					today={ today }
					focused={ focused }
					onFocusedChange={ setFocused }
					selected={ selected }
					min={ min }
					max={ max }
					onSelect={ onSelect }
					onDismiss={ onDismiss }
				/>
			) }
		</div>
	);
};
