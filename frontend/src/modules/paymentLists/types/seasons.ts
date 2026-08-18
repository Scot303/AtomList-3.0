import { todayInTimeZone } from '@/components/ui/fields/dateUtils';


/**
 * The studio's year is a season, not a calendar year: it opens in September and closes the following August, so every
 * one of them spans two calendar years and is named after both - "2026/2027".
 *
 * A season is identified by the year it opens in, which is what the summary endpoint takes.
 */

export const SEASON_START_MONTH = 9;


export function currentSeasonStart(): number {
	const today = todayInTimeZone();
	const year = today.getFullYear();
	const month = today.getMonth() + 1;

	return month >= SEASON_START_MONTH ? year : year - 1;
}


/** How a season is written: `2026` opens the "2026/2027" one. */
export function formatSeason(startYear: number): string {
	return `${ startYear }/${ startYear + 1 }`;
}


/**
 * Which season a given month belongs to, by the year it opened in.
 */
export function seasonStartOf(year: number, month: number): number {
	return month >= SEASON_START_MONTH ? year : year - 1;
}
