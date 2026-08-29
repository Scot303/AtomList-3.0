import type { ExtendedSelectOption } from '@/components/ui/extendedSelect';
import { formatCurrency, LOCALE } from '@/lib/locale';
import type { InstructorView } from '../types/types.ts';


export function toInstructorOptions(instructors: InstructorView[]): ExtendedSelectOption[] {
	return [...instructors]
		.sort((left, right) =>
			left.lastName.localeCompare(right.lastName, LOCALE) || left.name.localeCompare(right.name, LOCALE))
		.map((instructor) => ( {
			id: instructor.id,
			name: instructor.fullName,
			hint: instructor.active ? `${ formatCurrency(instructor.costPerHour) } za godzinę` : 'nieaktywny',
		} ));
}
