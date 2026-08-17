import type { GroupType, GroupView } from '@/modules/groups/types/types.ts';
import { type ActiveTag, toActiveTag } from '@/types/rowTags.ts';
import type { PersonView } from './types.ts';


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
	groupTypes: GroupType[];
	person: PersonView;
}


export function toPersonRow(person: PersonView, groupsById: Map<string, GroupView>): PersonRow {
	const groups = person.groupIds
		.map((id) => groupsById.get(id))
		.filter((group): group is GroupView => group !== undefined);

	const types: GroupType[] = ( ['OPEN', 'TOURNAMENT'] as const )
		.filter((type) => groups.some((group) => group.type === type));

	return {
		id: person.id,
		name: person.name,
		lastName: person.lastName,
		dateOfBirth: person.dateOfBirth ?? '',
		contractSigned: person.contractSigned,
		activeTag: toActiveTag(person.active),
		groupIds: person.groupIds,
		groupTypes: types,
		person,
	};
}
