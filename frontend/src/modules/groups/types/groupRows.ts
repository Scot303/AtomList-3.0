import { COLOR_POOL } from '@/components/dataTable';
import type { TagOption, TagRecord } from '@/components/ui/tags';
import { tagOptions } from '@/components/ui/tags';
import { type ActiveTag, toActiveTag } from '@/types/rowTags.ts';
import type { GroupBillingType, GroupType, GroupView } from './types.ts';


/* ── Kind of group ───────────────────────────────────────────────────────── */

export const GROUP_TYPE_TAGS: TagRecord<GroupType> = {
	OPEN: { id: 'OPEN', name: 'OPEN', color: 'blue' },
	TOURNAMENT: { id: 'TOURNAMENT', name: 'TURNIEJOWE', color: 'red' },
};

export const GROUP_TYPE_OPTIONS: TagOption[] = tagOptions(GROUP_TYPE_TAGS);


/* ── Billing ─────────────────────────────────────────────────────────────── */

export const BILLING_TYPE_TAGS: TagRecord<GroupBillingType> = {
	MONTHLY: { id: 'MONTHLY', name: 'Miesięczne', color: 'indigo' },
	PER_CLASS: { id: 'PER_CLASS', name: 'Za wejście', color: 'amber' },
};

export const BILLING_TYPE_OPTIONS: TagOption[] = tagOptions(BILLING_TYPE_TAGS);


/* ── Row ─────────────────────────────────────────────────────────────────── */

/**
 * A group as the table reads them.
 */
export interface GroupRow {
	id: string;
	name: string;
	color: string;
	type: GroupType;
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
		type: group.type,
		costForAttending: group.costForAttending,
		billingType: group.billingType,
		activeTag: toActiveTag(group.active),
		group,
	};
}


/* ── Group colors ────────────────────────────────────────────────────────── */

/**
 * The group's own color, or a stable one derived from its id so a group without one still reads as itself.
 */
export function resolveGroupColor(group: Pick<GroupView, 'id' | 'color'>): string {
	if (group.color) {
		return `#${ group.color }`;
	}

	let hash = 0;

	for (const character of group.id) {
		hash = ( hash * 31 + character.charCodeAt(0) ) | 0;
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
		.map((group) => ( {
			id: group.id,
			name: group.name,
			color: resolveGroupColor(group),
			hint: group.type === 'TOURNAMENT' ? 'turniejowa' : undefined,
		} ));
}
