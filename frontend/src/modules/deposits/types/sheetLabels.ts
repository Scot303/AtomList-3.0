import { monthName } from '@/utils/dateUtils.ts';


/**
 * Which sheet a settlement or a planned line landed on, for a line of text rather than a heading.
 */
export function describeSheet(
	year: number | null,
	month: number | null,
	tournament: boolean,
	name?: string | null,
): string {
	if (month === null || year === null) {
		return name !== null && name !== undefined && name !== '' ? name : 'Lista niestandardowa';
	}

	return `${ monthName(month) } ${ year }${ tournament ? ' - TURNIEJOWA' : '' }`;
}
