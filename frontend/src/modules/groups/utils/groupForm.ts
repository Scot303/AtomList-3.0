import { type GroupFormValues, parseCost } from '../schemas/groupSchemas';
import type { CreateGroupPayload, GroupView, UpdateGroupPayload } from '../types/types.ts';

export function blankGroupForm(): GroupFormValues {
	return {
		name: '',
		tournamentGroup: false,
		costForAttending: '',
		billingType: 'MONTHLY',
		active: true,
		color: '',
		note: '',
	};
}

export function groupToForm(group: GroupView): GroupFormValues {
	return {
		name: group.name,
		tournamentGroup: group.tournamentGroup,
		costForAttending: String(group.costForAttending),
		billingType: group.billingType,
		active: group.active,
		color: group.color ?? '',
		note: group.note ?? '',
	};
}

/**
 * A whole new group. An emptied field is left out rather than sent blank.
 */
export function buildCreatePayload(values: GroupFormValues): CreateGroupPayload {
	const payload: CreateGroupPayload = {
		name: values.name,
		tournamentGroup: values.tournamentGroup,
		costForAttending: parseCost(values.costForAttending),
		billingType: values.billingType,
	};

	if (values.color !== '') {
		payload.color = values.color;
	}

	if (values.note !== '') {
		payload.note = values.note;
	}

	return payload;
}

/**
 * Only what the user actually changed. An empty object means there is nothing to save.
 */
export function buildUpdatePayload(values: GroupFormValues, group: GroupView): UpdateGroupPayload {
	const before = groupToForm(group);
	const payload: UpdateGroupPayload = {};

	if (values.name !== before.name) {
		payload.name = values.name;
	}

	if (values.tournamentGroup !== before.tournamentGroup) {
		payload.tournamentGroup = values.tournamentGroup;
	}

	// Compared as numbers, so re-typing `50.00` over `50` is not a change worth sending.
	if (parseCost(values.costForAttending) !== parseCost(before.costForAttending)) {
		payload.costForAttending = parseCost(values.costForAttending);
	}

	if (values.billingType !== before.billingType) {
		payload.billingType = values.billingType;
	}

	if (values.active !== before.active) {
		payload.active = values.active;
	}

	if (values.color !== before.color && values.color !== '') {
		payload.color = values.color;
	}

	if (values.note !== before.note) {
		payload.note = values.note;
	}

	return payload;
}
