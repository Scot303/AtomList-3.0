import type { TagOption } from '@/components/ui/tags';
import type { GroupView, PersonView } from './types.ts';


/* ── Active ──────────────────────────────────────────────────────────────── */

export const ACTIVE_ID = 'active';
export const INACTIVE_ID = 'inactive';

export type ActiveTag = typeof ACTIVE_ID | typeof INACTIVE_ID;

export const ACTIVE_TAG_OPTIONS: TagOption[] = [
	{ id: ACTIVE_ID, name: 'Aktywna', color: 'emerald' },
	{ id: INACTIVE_ID, name: 'Nieaktywna', color: 'slate' },
];


/* ── Kind of group ───────────────────────────────────────────────────────── */

export const OPEN_KIND = 'open';
export const TOURNAMENT_KIND = 'tournament';

export type GroupKind = typeof OPEN_KIND | typeof TOURNAMENT_KIND;

export const GROUP_KIND_OPTIONS: TagOption[] = [
	{ id: OPEN_KIND, name: 'OPEN', color: 'blue' },
	{ id: TOURNAMENT_KIND, name: 'TURNIEJOWE', color: 'red' },
];

/** The color of each kind's quick-filter chip is tinted with. Six hex digits, as filter tags store them. */
export const GROUP_KIND_COLORS: Record<GroupKind, string> = {
	[OPEN_KIND]: '3B82F6',
	[TOURNAMENT_KIND]: 'EF4444',
};


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


/* ── Group colors ───────────────────────────────────────────────────────── */

const COLOR_POOL = [
	'EF4444', 'F97316', 'F59E0B', 'EAB308', '84CC16',
	'22C55E', '10B981', '14B8A6', '06B6D4', '0EA5E9',
	'3B82F6', '6366F1', '8B5CF6', 'A855F7', 'D946EF',
	'EC4899', 'F43F5E',
] as const;

export function resolveGroupColor(group: Pick<GroupView, 'id' | 'color'>): string {
	if (group.color) {
		return `#${ group.color }`;
	}

	let hash = 0;

	for (const character of group.id) {
		hash = (hash * 31 + character.charCodeAt(0)) | 0;
	}

	return `#${ COLOR_POOL[Math.abs(hash) % COLOR_POOL.length] }`;
}

/**
 * The loaded groups keyed by id, as every row needs them.
 *
 * Built once per page render rather than per row.
 */
export function indexGroups(groups: GroupView[]): Map<string, GroupView> {
	return new Map(groups.map((group) => [group.id, group]));
}

/**
 * Tag options for the 'Grupy' column, from the loaded groups.
 *
 * That is the whole list, inactive ones included, so it covers every group a person can still hold a membership in.
 */
export function buildGroupOptions(groups: GroupView[]): TagOption[] {
	return [...groups]
		.sort((left, right) => left.name.localeCompare(right.name))
		.map((group) => ({
			id: group.id,
			name: group.name,
			color: resolveGroupColor(group),
			hint: group.tournamentGroup ? 'turniejowa' : undefined,
		}));
}
