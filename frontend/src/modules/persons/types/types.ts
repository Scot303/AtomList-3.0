/**
 * Mirrors of the payloads the persons and memberships endpoints exchange.
 */

import type { GroupBillingType, GroupType } from '@/modules/groups/types/types.ts';
import type { ScopeSplit } from '@/types/finance.ts';


/** Mirror of the backend's `PersonView`. */
export interface PersonView {
	id: string;
	name: string;
	lastName: string;
	fullName: string;
	/** This person's own number. Null means they are reached through the family's. */
	phone: string | null;
	/** Their own number, or the family's when they have none. */
	effectivePhone: string | null;
	email: string | null;
	dateOfBirth: string | null;
	joinedStudioAt: string;
	joinedClubDate: string | null;
	leftClubDate: string | null;
	active: boolean;
	contractSigned: boolean;
	/** A student status, worth a permanent reduction on every membership fee. */
	studentDiscount: boolean;
	familyId: string | null;
	/** Ids of the currently attended groups, in group-name order. */
	groupIds: string[];
	note: string | null;
}


/**
 * Mirror of the backend's `CreatePersonRequest`.
 */
export interface CreatePersonPayload {
	name: string;
	lastName: string;
	phone?: string;
	email?: string;
	dateOfBirth?: string;
	joinedStudioAt?: string;
	joinedClubDate?: string;
	leftClubDate?: string;
	contractSigned?: boolean;
	studentDiscount?: boolean;
	familyId?: string;
	note?: string;
}


/** Every field optional: the backend leaves a missing one alone. */
export interface UpdatePersonPayload {
	name?: string;
	lastName?: string;
	phone?: string;
	email?: string;
	dateOfBirth?: string;
	joinedStudioAt?: string;
	joinedClubDate?: string;
	clearJoinedClubDate?: boolean;
	leftClubDate?: string;
	clearLeftClubDate?: boolean;
	active?: boolean;
	contractSigned?: boolean;
	studentDiscount?: boolean;
	familyId?: string;
	/** Detaches the person from their family. */
	clearFamily?: boolean;
	note?: string;
}


/** Mirror of the backend's `MembershipView`. */
export interface MembershipView {
	id: string;
	personId: string;
	personName: string;
	groupId: string;
	groupName: string;
	billingType: GroupBillingType;
	groupType: GroupType;
	joinedAt: string;
	/** Null while the membership is running. */
	leftAt: string | null;
	active: boolean;
	joinedMidMonth: boolean;
	groupDefaultCost: number;
	/** An individually agreed amount replacing the group's default. */
	customMonthlyCost: number | null;
	/** What is actually billed month after month - the custom amount when there is one, the group's otherwise. */
	effectiveCost: number;
	/** What the joining month is billed at, or null when it is billed in full like every other month. */
	firstMonthCost: number | null;
	note: string | null;
}


export interface CreateMembershipPayload {
	groupId: string;
	joinedAt?: string;
	customMonthlyCost?: number;
	/** What to bill for the joining month, when `joinedAt` falls part-way through it. */
	firstMonthCost?: number;
	note?: string;
}


export interface UpdateMembershipPayload {
	joinedAt?: string;
	customMonthlyCost?: number;
	/** Puts the membership back on the group's default rate. */
	clearCustomMonthlyCost?: boolean;
	firstMonthCost?: number;
	/** Puts the joining month back on the standing rate. */
	clearFirstMonthCost?: boolean;
	note?: string;
}


/**
 * Mirror of the backend's `FamilyMemberView` - one household member: who they are and what they attend.
 */
export interface FamilyMemberView {
	id: string;
	name: string;
	lastName: string;
	fullName: string;
	/** `YYYY-MM-DD`. */
	dateOfBirth: string | null;
	/** This member's own number. Null means they are reached through the family's. */
	phone: string | null;
	/** Their own number, or the family's when they have none. */
	effectivePhone: string | null;
	active: boolean;
	/** Ids of the currently attended groups, in group-name order, to be resolved against the loaded groups. */
	groupIds: string[];
}


/**
 * Mirror of the backend's `CreateUpdateFamilyRequest`.
 */
export interface CreateUpdateFamilyPayload {
	name: string;
	phone?: string;
	note?: string;
}


/** Mirror of the backend's `FamilyView`. */
export interface FamilyView {
	id: string;
	name: string;
	phone: string | null;
	note: string | null;
	/** The household's members in name order. */
	members: FamilyMemberView[];
}


/* ── Arrears ─────────────────────────────────────────────────────────────── */

/**
 * Mirror of the backend's `OutstandingPaymentView`.
 */
export interface OutstandingPaymentView {
	paymentId: string;
	paymentCode: string;
	listId: string;
	year: number | null;
	month: number | null;
	tournamentList: boolean;
	listName: string | null;
	listClosed: boolean;
	groupId: string | null;
	description: string | null;
	amountToPay: number;
	amountSettled: number;
	/** What is still owed on it, which is what makes this an arrear. */
	outstanding: number;
}


/**
 * Mirror of the backend's `PersonArrearsView` - everything one person still owes, oldest month first.
 */
export interface PersonArrearsView {
	personId: string;
	personName: string;
	totalBilled: number;
	totalSettled: number;
	totalOutstanding: number;
	payments: OutstandingPaymentView[];
}


/* ── Discount preview ────────────────────────────────────────────────────── */

/** One configured step of a ladder. Mirror of `PersonDiscountView.Rung`. */
export interface DiscountRung {
	threshold: number;
	/** Whole-number percentage - 10 means 10%. */
	percent: number;
	/** Whether this is the rung the percentage was read off. */
	applied: boolean;
}


/**
 * One of the two parts of the total, with the ladder it came from. Mirror of `PersonDiscountView.Component`.
 */
export interface DiscountComponent {
	/** What the ladder was looked up by - the family position, or the number of groups. Null when nothing is charged. */
	input: number | null;
	/** The rung that answered, or null when nothing is configured at or below `input`. */
	matchedThreshold: number | null;
	percent: number;
	ladder: DiscountRung[];
}


/** One member of the household as the ladder sees them. Mirror of `PersonDiscountView.Sibling`. */
export interface DiscountSibling {
	personId: string;
	fullName: string;
	/** Where they sit, counting from 1, or null when nothing is being charged for them this month. */
	position: number | null;
	/** The recurring charge the order was decided on. Per-class groups are not in it. */
	monthlyBase: number | null;
	/** Whether this is the person the preview was asked for. */
	self: boolean;
}


/** Mirror of `PersonDiscountView.Household`. */
export interface DiscountHousehold {
	familyId: string;
	familyName: string;
	/** In ladder order, everybody who takes up no slot last. */
	members: DiscountSibling[];
}


/** Mirror of `PersonDiscountView.CountedMembership` - one group, priced for the month. */
export interface CountedMembership {
	membershipId: string;
	groupId: string;
	groupName: string;
	/** Which sheet it is billed on, and so which account it is paid into. */
	type: GroupType;
	perClass: boolean;
	/** The rate billed this month - the joining month's part-month amount where one was agreed. For a per-class group, the price of one class. */
	unitCost: number;
	/** The charge before the discount. Zero for a per-class group, which is billed by attendance nobody has recorded yet. */
	gross: number;
	discountAmount: number;
	/** What is left owing, which is what a sheet built now would charge. */
	amountToPay: number;
	/** False for a membership that ended mid-month: still counted, but no longer running. */
	current: boolean;
	/** False for a group this person pays nothing for this month: shown for the explanation, but not counted towards the discount. */
	counted: boolean;
}


/**
 * Mirror of the backend's `PersonDiscountView` - one month's discount for one person, with its inputs and what it comes to.
 */
export interface PersonDiscountView {
	personId: string;
	personName: string;
	year: number;
	month: number;
	active: boolean;
	/** Whether anything is being charged this month. False leaves both parts at zero. */
	billed: boolean;
	/** Null when the person has no family, in which case they are positioned as the first person. */
	household: DiscountHousehold | null;
	memberships: CountedMembership[];
	/** What those memberships come to, split by sheet. Per-class groups are not in it. */
	totals: ScopeSplit;
	familyDiscount: DiscountComponent;
	groupCountDiscount: DiscountComponent;
	/** Whether this person holds a student status. True even in a month nothing is charged. */
	studentDiscount: boolean;
	studentPercent: number;
	/** The three parts added and capped, which is what a sheet built now would apply. */
	totalPercent: number;
	/** Whether the cap actually bit, meaning the parts summed past 100%. */
	capped: boolean;
}
