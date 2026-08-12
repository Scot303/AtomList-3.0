/**
 * Mirrors of the payloads the persons, groups, and memberships endpoints exchange.
 */

export type GroupBillingType = 'MONTHLY' | 'PER_CLASS';

/** Mirror of the backend's `GroupView`. */
export interface GroupView {
	id: string;
	name: string;
	tournamentGroup: boolean;
	/** `BigDecimal` on the wire, which serialises to a JSON number. */
	costForAttending: number;
	billingType: GroupBillingType;
	active: boolean;
	/** Six hex digits, no leading `#`. */
	color: string | null;
	note: string | null;
}


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
	active: boolean;
	contractSigned: boolean;
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
	contractSigned?: boolean;
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
	active?: boolean;
	contractSigned?: boolean;
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
	tournamentGroup: boolean;
	joinedAt: string;
	/** Null while the membership is running. */
	leftAt: string | null;
	active: boolean;
	groupDefaultCost: number;
	/** An individually agreed amount replacing the group's default. */
	customMonthlyCost: number | null;
	/** What is actually billed - the custom amount when there is one, the group's otherwise. */
	effectiveCost: number;
	note: string | null;
}

export interface CreateMembershipPayload {
	groupId: string;
	joinedAt?: string;
	customMonthlyCost?: number;
	note?: string;
}

export interface UpdateMembershipPayload {
	joinedAt?: string;
	customMonthlyCost?: number;
	/** Puts the membership back on the group's default rate. */
	clearCustomMonthlyCost?: boolean;
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

/** Mirror of the backend's `FamilyView`. */
export interface FamilyView {
	id: string;
	name: string;
	phone: string | null;
	note: string | null;
	/** The household's members in name order. */
	members: FamilyMemberView[];
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

/** One membership counted toward the group-count discount. Mirror of `PersonDiscountView.CountedMembership`. */
export interface CountedMembership {
	membershipId: string;
	groupId: string;
	groupName: string;
	perClass: boolean;
	/** Null for a per-class group, which has no monthly figure. */
	monthlyCost: number | null;
	/** False for a membership that ended mid-month: still counted, but no longer running. */
	current: boolean;
}

/**
 * Mirror of the backend's `PersonDiscountView` - this month's discount for one person, with its inputs.
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
	familyDiscount: DiscountComponent;
	groupCountDiscount: DiscountComponent;
	/** The two parts added and capped, which is what a sheet built now would apply. */
	totalPercent: number;
	/** Whether the cap actually bit, meaning the parts summed past 100%. */
	capped: boolean;
}
