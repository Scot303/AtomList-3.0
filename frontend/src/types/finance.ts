import type { TagOption } from '@/components/ui/tags';


/** Mirror of the backend's `PaymentMethod`. */
export type PaymentMethod = 'TRANSFER' | 'CASH' | 'BLIK';

export const PAYMENT_METHOD_OPTIONS: TagOption[] = [
	{ id: 'TRANSFER', name: 'Przelew', color: 'blue' },
	{ id: 'CASH', name: 'Gotówka', color: 'emerald' },
	{ id: 'BLIK', name: 'BLIK', color: 'violet' },
];

export const PAYMENT_METHOD_NAMES: Record<PaymentMethod, string> = {
	TRANSFER: 'Przelew',
	CASH: 'Gotówka',
	BLIK: 'BLIK',
};


/**
 * Mirror of the backend's `CoveredPersonView` - one of the people a deposit of money was for.
 */
export interface CoveredPersonView {
	id: string;
	name: string;
	lastName: string;
	fullName: string;
	phone: string | null;
}


export function coveredPersonLabel(person: CoveredPersonView): string {
	return `${ person.name } ${ person.lastName }`;
}


export function coveredPersonsSummary(persons: CoveredPersonView[]): string {
	const [first] = persons;

	if (first === undefined) {
		return '';
	}

	return persons.length === 1 ? coveredPersonLabel(first) : `${ coveredPersonLabel(first) } +${ persons.length - 1 }`;
}


export function coveredPersonsNames(persons: CoveredPersonView[]): string {
	return persons.map(coveredPersonLabel).join(', ');
}


export function coveredPersonsPhones(persons: CoveredPersonView[]): string {
	const phones = persons
		.map((person) => person.phone)
		.filter((phone): phone is string => phone !== null && phone !== '');

	return [...new Set(phones)].join(', ');
}
