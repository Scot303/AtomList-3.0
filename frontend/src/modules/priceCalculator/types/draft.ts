import type { PriceQuotePayload } from './types.ts';


/** What a per-entry group is billed for when nobody has said otherwise. */
export const DEFAULT_ENTRIES = 1;


/**
 * One person as the calculator is filling them in.
 */
export interface DraftMember {
	key: string;
	groupIds: string[];
	/** Expected entries per per-entry group, keyed by group id. Absent means {@link DEFAULT_ENTRIES}. */
	entries: Record<string, number>;
	studentDiscount: boolean;
}


export function emptyMember(key: string): DraftMember {
	return { key, groupIds: [], entries: {}, studentDiscount: false };
}


/**
 * How many entries this person is billed for in a group.
 */
export function entriesFor(member: DraftMember, groupId: string): number {
	return member.entries[groupId] ?? DEFAULT_ENTRIES;
}


/**
 * Replaces the picked groups, dropping the entry counts of any group that is no longer picked.
 */
export function withGroupIds(member: DraftMember, groupIds: string[]): DraftMember {
	const entries: Record<string, number> = {};

	for (const groupId of groupIds) {
		const count = member.entries[groupId];

		if (count !== undefined) {
			entries[groupId] = count;
		}
	}

	return { ...member, groupIds, entries };
}


export function withEntries(member: DraftMember, groupId: string, count: number): DraftMember {
	return { ...member, entries: { ...member.entries, [groupId]: count } };
}


/**
 * Whether anything has been picked at all, which is what the calculate button waits for.
 */
export function hasAnySelection(members: DraftMember[]): boolean {
	return members.some((member) => member.groupIds.length > 0);
}


/**
 * The request the backend prices. The order is the order on screen, which is what stands in for seniority when two people are billed the same amount.
 */
export function toPayload(members: DraftMember[]): PriceQuotePayload {
	return {
		members: members.map((member) => ( {
			groups: member.groupIds.map((groupId) => ( {
				groupId,
				entries: member.entries[groupId] ?? null,
			} )),
			studentDiscount: member.studentDiscount,
		} )),
	};
}
