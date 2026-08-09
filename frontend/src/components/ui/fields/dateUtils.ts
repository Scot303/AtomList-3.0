import { FIRST_DAY_OF_WEEK, LOCALE, TIME_ZONE } from '@/lib/locale';

/**
 * Date helpers for {@link DatePicker}, working in `YYYY-MM-DD`.
 */

export function parseISODate(value: string): Date | null {
	if (value === '') {
		return null;
	}

	// Parsed as local midnight: `new Date('2026-08-08')` is UTC, which lands on the 7th west of it.
	const date = new Date(`${ value }T00:00:00`);

	return Number.isNaN(date.getTime()) ? null : date;
}

export function toISODate(year: number, month: number, day: number): string {
	return `${ year }-${ String(month + 1).padStart(2, '0') }-${ String(day).padStart(2, '0') }`;
}

export function dateToISO(date: Date): string {
	return toISODate(date.getFullYear(), date.getMonth(), date.getDate());
}

const businessDayFormat = new Intl.DateTimeFormat(LOCALE, {
	timeZone: TIME_ZONE,
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
});

/**
 * The day it currently is in the chosen time-zone, as a local-midnight `Date` like every other date here.
 */
export function todayInTimeZone(): Date {
	const parts = Object.fromEntries(
		businessDayFormat.formatToParts(new Date()).map(({ type, value }) => [type, value]),
	);

	return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}

const longFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });

export function formatLongDate(value: string): string {
	const date = parseISODate(value);

	return date === null ? '' : longFormat.format(date);
}

/**
 * Month and weekday names from `Intl` rather than from translation keys.
 */
export const MONTH_NAMES: string[] = Array.from({ length: 12 }, (_, month) =>
	new Intl.DateTimeFormat(LOCALE, { month: 'long' }).format(new Date(2000, month, 1)),
);

export const WEEKDAY_NAMES: string[] = Array.from({ length: 7 }, (_, offset) => {
	// 2000-01-02 was a Sunday, so adding the offset walks the week from the configured first day.
	const day = new Date(2000, 0, 2 + ((FIRST_DAY_OF_WEEK + offset) % 7));

	return new Intl.DateTimeFormat(LOCALE, { weekday: 'short' }).format(day);
});

/** How many blank cells precede the 1st, so it lands under the right weekday name. */
export function leadingBlanks(year: number, month: number): number {
	return (new Date(year, month, 1).getDay() - FIRST_DAY_OF_WEEK + 7) % 7;
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

export function isSameDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Clamps to the day, so a `min` or `max` with a time on it does not exclude its own date. */
export function isWithin(date: Date, min: Date | null, max: Date | null): boolean {
	const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

	if (min !== null && day < startOfDay(min)) {
		return false;
	}

	return !(max !== null && day > startOfDay(max));
}

function startOfDay(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);

	return next;
}

export function addMonths(date: Date, months: number): Date {
	const next = new Date(date);
	// Clamp the day first, so 31 January plus one month is 28 February and not 3 March.
	next.setDate(1);
	next.setMonth(next.getMonth() + months);
	next.setDate(Math.min(date.getDate(), daysInMonth(next.getFullYear(), next.getMonth())));

	return next;
}
