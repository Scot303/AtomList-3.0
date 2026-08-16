import { monthName } from '@/components/ui/fields/dateUtils';
import type { PaymentListView } from './types.ts';


/**
 * What to call a list on screen: the month it covers, or the name somebody gave it.
 */
export function describeList(list: PaymentListView): string {
	if (list.name !== null && list.name !== '') {
		return list.name;
	}

	if (list.month === null || list.year === null) {
		return 'Lista płatności';
	}

	const kind = list.isTournamentList ? 'TURNIEJOWA' : 'OPEN';

	return `${ monthName(list.month) } ${ list.year } - ${ kind }`;
}


export function isCustomList(list: PaymentListView): boolean {
	return list.type === 'CUSTOM' || list.type === 'CAMP';
}
