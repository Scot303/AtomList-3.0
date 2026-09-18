import { useState } from 'react';
import { MonthColumn } from './MonthColumn';
import { YearColumn } from './YearColumn';


/** How far either side of this year the list reaches when no `min` or `max` says otherwise. */
const EARLIEST_OFFSET = -100;
const LATEST_OFFSET = 20;


interface YearMonthPickerProps {
	today: Date;
	/** The year and month the calendar opened on - the field's own where it has one, otherwise this month. */
	pendingYear: number;
	pendingMonth: number;
	min: Date | null;
	max: Date | null;
	onPick: (year: number, month: number) => void;
}


/**
 * The quick switch behind the calendar's title: years on the left, months on the right.
 */
export const YearMonthPicker = ({ today, pendingYear, pendingMonth, min, max, onPick }: YearMonthPickerProps) => {
	const [year, setYear] = useState<number | null>(null);
	const [month, setMonth] = useState<number | null>(null);

	const currentYear = today.getFullYear();

	const firstYear = Math.min(min?.getFullYear() ?? currentYear + EARLIEST_OFFSET, pendingYear);
	const lastYear = Math.max(max?.getFullYear() ?? currentYear + LATEST_OFFSET, pendingYear, firstYear);

	const choose = (nextYear: number | null, nextMonth: number | null) => {
		if (nextYear !== null && nextMonth !== null) {
			onPick(nextYear, nextMonth);
			return;
		}

		setYear(nextYear);
		setMonth(nextMonth);
	};

	const shownYear = year ?? pendingYear;

	return (
		<div className="grid grid-cols-2 gap-2">
			<YearColumn
				firstYear={ firstYear }
				lastYear={ lastYear }
				value={ year }
				pending={ pendingYear }
				currentYear={ currentYear }
				onPick={ (next) => choose(next, month) }
			/>

			<MonthColumn
				year={ shownYear }
				value={ month }
				pending={ pendingMonth }
				currentMonth={ shownYear === currentYear ? today.getMonth() : null }
				min={ min }
				max={ max }
				onPick={ (next) => choose(year, next) }
			/>
		</div>
	);
};
