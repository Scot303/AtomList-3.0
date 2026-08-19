import { useState } from 'react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { cn } from '@/lib/cn';
import { LOCALE } from '@/lib/locale';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useFamilies } from '@/modules/persons/hooks/useFamilies';
import { usePersons } from '@/modules/persons/hooks/usePersons';
import { calculateAge } from '@/modules/persons/utils/personFormat';
import type { PersonView } from '@/modules/persons/types/types.ts';
import { GroupMemberRow, MEMBER_GRID } from '../components/groupMembers/GroupMemberRow';


const SORT_OPTIONS = [
	{ id: 'lastName', name: 'Nazwisko' },
	{ id: 'age', name: 'Wiek' },
] as const;

type MemberSort = typeof SORT_OPTIONS[number]['id'];


function byLastName(left: PersonView, right: PersonView): number {
	return left.lastName.localeCompare(right.lastName, LOCALE) || left.name.localeCompare(right.name, LOCALE);
}


function byAge(left: PersonView, right: PersonView): number {
	const leftAge = calculateAge(left.dateOfBirth);
	const rightAge = calculateAge(right.dateOfBirth);

	if (leftAge === null || rightAge === null) {
		if (leftAge === rightAge) {
			return byLastName(left, right);
		}

		return leftAge === null ? 1 : -1;
	}

	return leftAge - rightAge || byLastName(left, right);
}


interface GroupMembersModalProps {
	groupId: string;
	groupName: string;
}


/**
 * Who is in the opened group right now.
 */
export default function GroupMembersModal({ groupId }: GroupMembersModalProps) {
	const { hasPermission } = useAuth();

	if (!hasPermission('READ_PERSONS')) {
		return <Alert tone="warning">Nie masz uprawnień do przeglądania osób.</Alert>;
	}

	return <MemberList groupId={ groupId }/>;
}


function MemberList({ groupId }: { groupId: string }) {
	const persons = usePersons();

	const [sort, setSort] = useState<MemberSort>('lastName');

	/* Subscribed to but not read. Keeping data fresh for the person details modal a row can open. */
	useFamilies();

	const members = ( persons.data ?? [] )
		.filter((person) => person.groupIds.includes(groupId))
		.sort(sort === 'age' ? byAge : byLastName);

	if (persons.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (persons.isError) {
		return <Alert tone="danger">{ persons.error.message }</Alert>;
	}

	if (members.length === 0) {
		return <Alert tone="info">W tym momencie nikt nie należy do tej grupy.</Alert>;
	}

	return (
		<div className="mt-2 space-y-3">
			<div className="flex items-center justify-end gap-1.5">
				<span className="mr-1 text-xs text-os-text-muted">Sortuj:</span>

				{ SORT_OPTIONS.map((option) => {
					const active = sort === option.id;

					return (
						<button
							key={ option.id }
							type="button"
							aria-pressed={ active }
							onClick={ () => setSort(option.id) }
							className={ cn(
								'shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold tracking-wide transition-colors outline-none',
								'focus-visible:ring-2 focus-visible:ring-os-primary/40',
								active
									? 'border-os-primary/50 bg-os-primary/10 text-os-primary'
									: 'border-os-border text-os-text-muted hover:bg-os-border/25 hover:text-os-text',
							) }
						>
							{ option.name }
						</button>
					);
				}) }
			</div>

			<div className="overflow-hidden rounded-xl border border-os-border">
				<div className={ `${ MEMBER_GRID } border-b border-os-border bg-os-surface/60 py-2 text-xs tracking-wide text-os-text-muted uppercase` }>
					<span>Osoba</span>
					<span>Telefon</span>
					<span>Wiek</span>
					<span className="text-right"></span>
				</div>

				<ul>
					{ members.map((member) => (
						<GroupMemberRow key={ member.id } member={ member }/>
					)) }
				</ul>
			</div>
		</div>
	);
}
