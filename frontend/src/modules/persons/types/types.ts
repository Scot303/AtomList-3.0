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
 * Mirror of the backend's `FamilyMemberView` - one household member, with the discount they currently attract.
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
	familyPosition: number | null;
	groupCount: number;
	/** Whole-number percentages - 10 means 10%. */
	familyPercent: number;
	groupCountPercent: number;
	/** The two added together and capped at 100, which is what the sheet would apply. */
	discountPercent: number;
}

/** Mirror of the backend's `FamilyView`. */
export interface FamilyView {
	id: string;
	name: string;
	phone: string | null;
	note: string | null;
	/** The household's members in name order, each carrying their own discount preview. */
	members: FamilyMemberView[];
}
