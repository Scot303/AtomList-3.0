import type { TagOption } from '@/components/ui/tags';
import type { GroupBillingType, GroupView } from './types.ts';


/* ── Kind of group ───────────────────────────────────────────────────────── */

export const OPEN_KIND = 'open';
export const TOURNAMENT_KIND = 'tournament';

export type GroupKind = typeof OPEN_KIND | typeof TOURNAMENT_KIND;

export const GROUP_KIND_OPTIONS: TagOption[] = [
	{ id: OPEN_KIND, name: 'OPEN', color: 'blue' },
	{ id: TOURNAMENT_KIND, name: 'TURNIEJOWE', color: 'red' },
];

/** The color each kind's quick-filter chip is tinted with. Six hex digits, as filter tags store them. */
export const GROUP_KIND_COLORS: Record<GroupKind, string> = {
	[OPEN_KIND]: '3B82F6',
	[TOURNAMENT_KIND]: 'EF4444',
};

export function toGroupKind(tournamentGroup: boolean): GroupKind {
	return tournamentGroup ? TOURNAMENT_KIND : OPEN_KIND;
}


/* ── Billing ─────────────────────────────────────────────────────────────── */

export const BILLING_TYPE_OPTIONS: TagOption[] = [
	{ id: 'MONTHLY', name: 'Miesięczne', color: 'indigo' },
	{ id: 'PER_CLASS', name: 'Za wejście', color: 'amber' },
];

export function billingTypeName(billingType: GroupBillingType): string {
	return BILLING_TYPE_OPTIONS.find((option) => option.id === billingType)?.name ?? billingType;
}


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
 * A group as the table reads them.
 */
export interface GroupRow {
	id: string;
	name: string;
	color: string;
	kind: GroupKind;
	costForAttending: number;
	billingType: GroupBillingType;
	activeTag: ActiveTag;
	group: GroupView;
}


export function toGroupRow(group: GroupView): GroupRow {
	return {
		id: group.id,
		name: group.name,
		color: resolveGroupColor(group),
		kind: toGroupKind(group.tournamentGroup),
		costForAttending: group.costForAttending,
		billingType: group.billingType,
		activeTag: group.active ? ACTIVE_ID : INACTIVE_ID,
		group,
	};
}


/* ── Group colors ────────────────────────────────────────────────────────── */

const COLOR_POOL = [
	'EF4444', 'F97316', 'F59E0B', 'EAB308', '84CC16',
	'22C55E', '10B981', '14B8A6', '06B6D4', '0EA5E9',
	'3B82F6', '6366F1', '8B5CF6', 'A855F7', 'D946EF',
	'EC4899', 'F43F5E',
] as const;

/**
 * The group's own color, or a stable one derived from its id so a group without one still reads as itself.
 */
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
 */
export function indexGroups(groups: GroupView[]): Map<string, GroupView> {
	return new Map(groups.map((group) => [group.id, group]));
}

/**
 * Tag options for a column that holds group ids, from the loaded groups.
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
