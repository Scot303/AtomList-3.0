import { Cake } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { parseISODate, todayInTimeZone } from '@/utils/dateUtils.ts';
import { cn } from '@/lib/cn';
import { LOCALE } from '@/lib/locale';
import type { PersonView } from '@/modules/persons/types/types';
import { calculateAge } from '@/modules/persons/utils/personFormat';


interface BirthdayIndicatorProps {
	persons: PersonView[];
	className?: string;
}


interface Birthday {
	id: string;
	fullName: string;
	age: number;
}


/** Shows the people whose birthday is today, using the studio's time zone. */
export function BirthdayIndicator({ persons, className }: BirthdayIndicatorProps) {
	const today = todayInTimeZone();

	const birthdays = persons.reduce<Birthday[]>((matches, person) => {
		const dateOfBirth = parseISODate(person.dateOfBirth ?? '');
		const age = calculateAge(person.dateOfBirth);

		if (dateOfBirth !== null && age !== null
			&& dateOfBirth.getMonth() === today.getMonth()
			&& dateOfBirth.getDate() === today.getDate()
		) {
			matches.push({ id: person.id, fullName: person.fullName, age });
		}

		return matches;
	}, []).sort((left, right) => left.fullName.localeCompare(right.fullName, LOCALE));

	if (birthdays.length === 0) {
		return null;
	}

	return (
		<Tooltip
			placement="bottom-start"
			className={ cn('text-os-error', className) }
			content={ (
				<div className="space-y-1">
					<p className="font-semibold">Dziś mają urodziny:</p>
					<ul className="space-y-0.5">
						{ birthdays.map((birthday) => (
							<li key={ birthday.id }>{ birthday.fullName } - ({ birthday.age }) lat</li>
						)) }
					</ul>
				</div>
			) }
		>
			<Cake aria-label="Dzisiejsze urodziny" className="size-5"/>
		</Tooltip>
	);
}
