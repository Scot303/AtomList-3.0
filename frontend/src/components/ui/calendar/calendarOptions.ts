import { daysInMonth, isWithin } from '@/utils/dateUtils.ts';


/** One row of the year and month lists, and how tall the box holding them is. */
export const OPTION_HEIGHT = 32;
export const OPTION_LIST_HEIGHT = 224;

/**
 * How much of a row is left empty, half above and half below.
 */
export const OPTION_GAP = 4;

/** How far a Page key jumps through such a list. */
const PAGE = 5;


/**
 * Where a key takes a vertical list's cursor, or `null` when the key is not one the list owns.
 */
export function moveIndex(key: string, current: number, count: number): number | null {
	const clamp = (index: number) => Math.min(Math.max(index, 0), count - 1);

	switch (key) {
		case 'ArrowUp':
			return clamp(current - 1);
		case 'ArrowDown':
			return clamp(current + 1);
		case 'PageUp':
			return clamp(current - PAGE);
		case 'PageDown':
			return clamp(current + PAGE);
		case 'Home':
			return 0;
		case 'End':
			return count - 1;
		default:
			return null;
	}
}


/**
 * Where a list opens: the row it should be centred on, kept inside the list.
 */
export function openIndex(index: number, count: number): number {
	return Math.min(Math.max(index, 0), count - 1);
}


/**
 * How far down the list has to start for row `index` to sit in the middle of the box.
 */
export function centeredOffset(index: number): number {
	return Math.max(0, index * OPTION_HEIGHT - ( OPTION_LIST_HEIGHT - OPTION_HEIGHT ) / 2);
}


/**
 * Whether any day of a month is pickable, so a month only greys out once the whole of it is out of range.
 */
export function isMonthWithin(year: number, month: number, min: Date | null, max: Date | null): boolean {
	return isWithin(new Date(year, month, daysInMonth(year, month)), min, null)
		&& isWithin(new Date(year, month, 1), null, max);
}
