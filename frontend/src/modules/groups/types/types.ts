export type GroupBillingType = 'MONTHLY' | 'PER_CLASS';

/** Mirror of the backend's `GroupView`. */
export interface GroupView {
	id: string;
	name: string;
	tournamentGroup: boolean;
	costForAttending: number;
	billingType: GroupBillingType;
	active: boolean;
	/** Six hex digits, no leading `#`. */
	color: string | null;
	note: string | null;
}


/** Mirror of the backend's `CreateGroupRequest`. */
export interface CreateGroupPayload {
	name: string;
	tournamentGroup?: boolean;
	costForAttending: number;
	billingType?: GroupBillingType;
	active?: boolean;
	color?: string;
	note?: string;
}

/** Every field optional: the backend leaves a missing one alone. Mirror of `UpdateGroupRequest`. */
export interface UpdateGroupPayload {
	name?: string;
	tournamentGroup?: boolean;
	costForAttending?: number;
	billingType?: GroupBillingType;
	active?: boolean;
	color?: string;
	note?: string;
}
