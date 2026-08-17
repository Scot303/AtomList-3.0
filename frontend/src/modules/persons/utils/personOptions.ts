import type { ExtendedSelectOption } from '@/components/ui/extendedSelect';
import { LOCALE } from '@/lib/locale';
import type { PersonView } from '@/modules/persons/types/types.ts';


/**
 * People as a person select offers them.
 *
 * Somebody inactive is still listed.
 */
export function toPersonOptions(persons: PersonView[]): ExtendedSelectOption[] {
	return [...persons]
		.sort((left, right) =>
			left.lastName.localeCompare(right.lastName, LOCALE) || left.name.localeCompare(right.name, LOCALE))
		.map((person) => ( {
			id: person.id,
			name: `${ person.name } ${ person.lastName }`,
			hint: person.active ? ( person.effectivePhone ?? undefined ) : 'nieaktywna',
		} ));
}
