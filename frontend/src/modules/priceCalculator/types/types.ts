import type { GroupType } from '@/modules/groups/types/types.ts';
import type { MoneyScope, ScopeSplit } from '@/types/finance.ts';


/* ── What is sent ────────────────────────────────────────────────────────── */

/**
 * One group somebody would join. Mirror of `PriceQuoteRequest.Selection`.
 */
export interface QuoteSelectionPayload {
	groupId: string;
	/** Expected classes, for a group billed per entry. Ignored for a monthly group; null bills one. */
	entries: number | null;
	/** An individually agreed rate replacing the group's own. Null bills the group's price. */
	customUnitCost: number | null;
}


/** Mirror of `PriceQuoteRequest.Member`. */
export interface QuoteMemberPayload {
	groups: QuoteSelectionPayload[];
	studentDiscount: boolean;
}


/** Mirror of `PriceQuoteRequest`. Everybody in it is quoted as one family. */
export interface PriceQuotePayload {
	members: QuoteMemberPayload[];
}


/* ── What comes back ─────────────────────────────────────────────────────── */

/** One configured step of a ladder. Mirror of `PriceQuoteView.Rung`. */
export interface QuoteRung {
	threshold: number;
	/** Whole-number percentage - 10 means 10%. */
	percent: number;
}


/** Mirror of the backend's `MoneyScope`. */
export type QuoteScope = MoneyScope;


/** Mirror of the backend's `ScopeSplit` - the quote split by the sheet each part is billed on. */
export type QuoteTotals = ScopeSplit;


/** One group on one person's quote. Mirror of `PriceQuoteView.Line`. */
export interface QuoteLine {
	groupId: string;
	groupName: string;
	type: GroupType;
	perClass: boolean;
	/** The group's rate - a monthly fee, or the price of one entry. */
	unitCost: number;
	/** How many are billed. Always 1 for a monthly group. */
	entries: number;
	gross: number;
	discountAmount: number;
	amountToPay: number;
	/** False for a group priced at nothing: shown, but counting towards neither ladder. */
	countedTowardsDiscount: boolean;
}


/** One person's quote. Mirror of `PriceQuoteView.Member`. */
export interface QuoteMember {
	/** Which person in the request this answers, counting from 0. */
	index: number;
	/** Whether anything at all is charged. False leaves every percentage at zero. */
	billed: boolean;
	/** Where they sit in the household, counting from 1, or null when nothing is charged for them. */
	familyPosition: number | null;
	/** The family rung that answered, or null when none is configured that low. */
	familyThreshold: number | null;
	groupCount: number;
	groupCountThreshold: number | null;
	/** The recurring monthly charge the household order was decided on. Per-entry groups are not in it. */
	monthlyBase: number;
	studentDiscount: boolean;
	familyPercent: number;
	groupCountPercent: number;
	studentPercent: number;
	/** The three parts added and capped, which is what a sheet built now would apply. */
	totalPercent: number;
	/** Whether the cap actually bit, meaning the parts summed past 100%. */
	capped: boolean;
	lines: QuoteLine[];
	totals: QuoteTotals;
}


/**
 * Mirror of the backend's `PriceQuoteView` - what a hypothetical household would pay, and why.
 */
export interface PriceQuoteView {
	/** In the order they were sent, so each lines up with the card that asked about it. */
	members: QuoteMember[];
	totals: QuoteTotals;
	familyLadder: QuoteRung[];
	groupCountLadder: QuoteRung[];
	studentDiscountPercent: number;
}
