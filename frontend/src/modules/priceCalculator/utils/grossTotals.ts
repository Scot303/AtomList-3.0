import type { GroupView } from '@/modules/groups/types/types.ts';
import { type DraftMember, entriesFor, unitCostFor } from '../types/draft.ts';


/**
 * The undiscounted price, split the way the two sheets are.
 */
export interface GrossTotals {
	open: number;
	tournament: number;
	total: number;
}


export const EMPTY_GROSS: GrossTotals = { open: 0, tournament: 0, total: 0 };


function round(amount: number): number {
	return Math.round(amount * 100) / 100;
}


/**
 * What this person would pay before any discount.
 */
export function grossOf(member: DraftMember, groupsById: Map<string, GroupView>): GrossTotals {
	let open = 0;
	let tournament = 0;

	for (const groupId of member.groupIds) {
		const group = groupsById.get(groupId);

		if (group === undefined) {
			continue;
		}

		const amount = round(unitCostFor(member, group) * ( group.billingType === 'PER_CLASS' ? entriesFor(member, groupId) : 1 ));

		if (group.type === 'TOURNAMENT') {
			tournament = round(tournament + amount);
		} else {
			open = round(open + amount);
		}
	}

	return { open, tournament, total: round(open + tournament) };
}


export function addGross(left: GrossTotals, right: GrossTotals): GrossTotals {
	return {
		open: round(left.open + right.open),
		tournament: round(left.tournament + right.tournament),
		total: round(left.total + right.total),
	};
}


/**
 * The whole household before any discount.
 */
export function householdGross(members: DraftMember[], groupsById: Map<string, GroupView>): GrossTotals {
	return members.reduce((running, member) => addGross(running, grossOf(member, groupsById)), EMPTY_GROSS);
}
