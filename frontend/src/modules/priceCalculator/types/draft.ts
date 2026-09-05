import type { GroupView } from '@/modules/groups/types/types.ts';
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
	/** Individually agreed rates, keyed by group id. Absent means the group's own price. A rate of 0 is a real override: it makes the group free and takes it out of both ladders. */
	customPrices: Record<string, number>;
	studentDiscount: boolean;
}


export function emptyMember(key: string): DraftMember {
	return { key, groupIds: [], entries: {}, customPrices: {}, studentDiscount: false };
}


/**
 * How many entries this person is billed for in a group.
 */
export function entriesFor(member: DraftMember, groupId: string): number {
	return member.entries[groupId] ?? DEFAULT_ENTRIES;
}


/**
 * The rate agreed for this person in a group, or null while the group's own price stands.
 */
export function customPriceFor(member: DraftMember, groupId: string): number | null {
	return member.customPrices[groupId] ?? null;
}


/**
 * The rate this person is billed at in a group, honoring an agreed amount over the group's default.
 */
export function unitCostFor(member: DraftMember, group: GroupView): number {
	return member.customPrices[group.id] ?? group.costForAttending;
}


/**
 * Replaces the picked groups, dropping the entry counts and agreed rates of any group that is no longer picked.
 */
export function withGroupIds(member: DraftMember, groupIds: string[]): DraftMember {
	const entries: Record<string, number> = {};
	const customPrices: Record<string, number> = {};

	for (const groupId of groupIds) {
		const count = member.entries[groupId];
		const price = member.customPrices[groupId];

		if (count !== undefined) {
			entries[groupId] = count;
		}

		if (price !== undefined) {
			customPrices[groupId] = price;
		}
	}

	return { ...member, groupIds, entries, customPrices };
}


export function withEntries(member: DraftMember, groupId: string, count: number): DraftMember {
	return { ...member, entries: { ...member.entries, [groupId]: count } };
}


/**
 * Sets an agreed rate for one group, or drops it back to the group's own price when given null.
 */
export function withCustomPrice(member: DraftMember, groupId: string, price: number | null): DraftMember {
	const customPrices = { ...member.customPrices };

	if (price === null) {
		delete customPrices[groupId];
	} else {
		customPrices[groupId] = price;
	}

	return { ...member, customPrices };
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
				customUnitCost: member.customPrices[groupId] ?? null,
			} )),
			studentDiscount: member.studentDiscount,
		} )),
	};
}
