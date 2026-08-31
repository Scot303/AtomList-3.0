import { parseAmount } from '../schemas/paymentSchemas';
import type { CustomListFormValues } from '../schemas/listSchemas';
import type { CreateCustomListPayload, PaymentListView, UpdateCustomListPayload } from '../types/types.ts';


/** The form as it opens: over an existing list, or blank for a new one. */
export function customListToForm(list?: PaymentListView): CustomListFormValues {
	return {
		name: list?.name ?? '',
		campList: list?.type === 'CAMP',
		populationMode: list?.populationMode ?? 'BY_GROUPS',
		groupIds: [],
		personIds: [],
		fixedPrice: list?.fixedPrice == null ? '' : String(list.fixedPrice),
		note: list?.note ?? '',
	};
}


/**
 * A whole new list.
 *
 * Whichever of `groupIds` and `personIds` the mode does not use is left out entirely: the backend refuses an empty one. An empty price or note is left out the same way.
 */
export function buildCreatePayload(values: CustomListFormValues): CreateCustomListPayload {
	const byGroups = values.populationMode === 'BY_GROUPS';

	const payload: CreateCustomListPayload = {
		name: values.name,
		campList: values.campList,
		populationMode: values.populationMode,
		...( byGroups ? { groupIds: values.groupIds } : { personIds: values.personIds } ),
	};

	if (values.fixedPrice !== '') {
		payload.fixedPrice = parseAmount(values.fixedPrice);
	}

	if (values.note !== '') {
		payload.note = values.note;
	}

	return payload;
}


/**
 * Only what the user actually changed.
 * An empty object means there is nothing to save.
 */
export function buildUpdatePayload(values: CustomListFormValues, list: PaymentListView): UpdateCustomListPayload {
	const payload: UpdateCustomListPayload = {};

	if (values.name !== ( list.name ?? '' )) {
		payload.name = values.name;
	}

	if (values.fixedPrice !== '' && parseAmount(values.fixedPrice) !== list.fixedPrice) {
		payload.fixedPrice = parseAmount(values.fixedPrice);
	}

	if (values.note !== ( list.note ?? '' )) {
		payload.note = values.note;
	}

	return payload;
}
