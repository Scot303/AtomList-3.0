import { parseISODate, todayInTimeZone } from '@/components/ui/fields/dateUtils';
import { LOCALE } from '@/lib/locale';
import type { FamilyView } from '../types/types.ts';

const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** `'2002-03-12'` → `'12.03.2002'`. */
export function formatShortDate(iso: string | null | undefined): string {
	const date = parseISODate(iso ?? '');

	return date === null ? '' : shortDateFormat.format(date);
}

/**
 * Completed years between a date of birth and today, or null when there is no usable date.
 */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
	const born = parseISODate(dateOfBirth ?? '');

	if (born === null) {
		return null;
	}

	const today = todayInTimeZone();
	let age = today.getFullYear() - born.getFullYear();

	// Completed years, so a birthday still ahead this year has not been lived through yet.
	const beforeBirthday = today.getMonth() < born.getMonth()
		|| (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());

	if (beforeBirthday) {
		age -= 1;
	}

	return age < 0 ? null : age;
}

/**
 * Polish needs three forms: 1 rok, 2-4 lata, 5-21 lat, 22-24 lata.
 */
export function formatYears(age: number): string {
	const lastTwo = age % 100;
	const last = age % 10;

	if (age === 1) {
		return '1 rok';
	}

	if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
		return `${ age } lata`;
	}

	return `${ age } lat`;
}

/**
 * How the Wiek column reads: the age, with the date it is worked out from after it.
 * The date is kept in view because it is what the cell actually edits.
 */
export function formatAge(dateOfBirth: string | null | undefined): string {
	const date = formatShortDate(dateOfBirth);

	if (date === '') {
		return '';
	}

	const age = calculateAge(dateOfBirth);

	return age === null ? date : `${ formatYears(age) } · ${ date }`;
}

/**
 * How a household reads where one has to be picked out: its name, with the first names of the members after it.
 */
export function formatFamilyName(family: FamilyView): string {
	const names = family.members.map((member) => member.name);

	return names.length === 0 ? family.name : `${ family.name } (${ names.join(', ') })`;
}
