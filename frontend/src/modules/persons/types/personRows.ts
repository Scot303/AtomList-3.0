import type { TagOption } from '@/components/ui/tags';
import { type GroupKind, OPEN_KIND, TOURNAMENT_KIND } from '@/modules/groups/types/groupRows.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import type { PersonView } from './types.ts';


/* ── Active ──────────────────────────────────────────────────────────────── */

export const ACTIVE_ID = 'active';
export const INACTIVE_ID = 'inactive';

export type ActiveTag = typeof ACTIVE_ID | typeof INACTIVE_ID;

export const ACTIVE_TAG_OPTIONS: TagOption[] = [
	{ id: ACTIVE_ID, name: 'Aktywna', color: 'emerald' },
	{ id: INACTIVE_ID, name: 'Nieaktywna', color: 'slate' },
];


/* ── Row ─────────────────────────────────────────────────────────────────── */

/**
 * A person as the table reads them.
 */
export interface PersonRow {
	id: string;
	name: string;
	lastName: string;
	/** `YYYY-MM-DD`, or `''`. Shown as an age, edited as a date. */
	dateOfBirth: string;
	contractSigned: boolean;
	activeTag: ActiveTag;
	/** Ids of the groups currently attended, matched against the Grupy column's options. */
	groupIds: string[];
	/** Which kinds of group those are. What the OPEN and TURNIEJOWI chips filter on. */
	groupKinds: GroupKind[];
	person: PersonView;
}


export function toPersonRow(person: PersonView, groupsById: Map<string, GroupView>): PersonRow {
	const groups = person.groupIds
		.map((id) => groupsById.get(id))
		.filter((group): group is GroupView => group !== undefined);

	const kinds: GroupKind[] = [];

	if (groups.some((group) => !group.tournamentGroup)) {
		kinds.push(OPEN_KIND);
	}

	if (groups.some((group) => group.tournamentGroup)) {
		kinds.push(TOURNAMENT_KIND);
	}

	return {
		id: person.id,
		name: person.name,
		lastName: person.lastName,
		dateOfBirth: person.dateOfBirth ?? '',
		contractSigned: person.contractSigned,
		activeTag: person.active ? ACTIVE_ID : INACTIVE_ID,
		groupIds: person.groupIds,
		groupKinds: kinds,
		person,
	};
}
