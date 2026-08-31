import { dateToISO, todayInTimeZone } from '@/utils/dateUtils.ts';
import type { PersonFormValues } from '../schemas/personSchemas';
import { formatPhone, phoneDigits } from './personFormat';
import type { CreatePersonPayload, PersonView, UpdatePersonPayload } from '../types/types.ts';


/**
 * Between the form and the wire, in both directions.
 */

/** A blank form. */
export function blankPersonForm(): PersonFormValues {
	return {
		name: '',
		lastName: '',
		dateOfBirth: '',
		phone: '',
		email: '',
		familyId: '',
		joinedStudioAt: dateToISO(todayInTimeZone()),
		joinedClubDate: '',
		leftClubDate: '',
		active: true,
		contractSigned: false,
		studentDiscount: false,
		note: '',
	};
}


export function personToForm(person: PersonView): PersonFormValues {
	return {
		name: person.name,
		lastName: person.lastName,
		dateOfBirth: person.dateOfBirth ?? '',
		phone: formatPhone(person.phone),
		email: person.email ?? '',
		familyId: person.familyId ?? '',
		joinedStudioAt: person.joinedStudioAt,
		joinedClubDate: person.joinedClubDate ?? '',
		leftClubDate: person.leftClubDate ?? '',
		active: person.active,
		contractSigned: person.contractSigned,
		studentDiscount: person.studentDiscount,
		note: person.note ?? '',
	};
}


/**
 * A whole new person. An emptied field is left out rather than sent blank - and a date has to be,
 * since `''` is not a date the backend can read.
 */
export function buildCreatePayload(values: PersonFormValues): CreatePersonPayload {
	const payload: CreatePersonPayload = {
		name: values.name,
		lastName: values.lastName,
		contractSigned: values.contractSigned,
		studentDiscount: values.studentDiscount,
	};

	if (values.dateOfBirth !== '') {
		payload.dateOfBirth = values.dateOfBirth;
	}

	if (values.joinedStudioAt !== '') {
		payload.joinedStudioAt = values.joinedStudioAt;
	}

	if (values.joinedClubDate !== '') {
		payload.joinedClubDate = values.joinedClubDate;
	}

	if (values.leftClubDate !== '') {
		payload.leftClubDate = values.leftClubDate;
	}

	if (values.phone !== '') {
		payload.phone = values.phone;
	}

	if (values.email !== '') {
		payload.email = values.email;
	}

	if (values.familyId !== '') {
		payload.familyId = values.familyId;
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
export function buildUpdatePayload(values: PersonFormValues, person: PersonView): UpdatePersonPayload {
	const before = personToForm(person);
	const payload: UpdatePersonPayload = {};

	if (values.name !== before.name) {
		payload.name = values.name;
	}

	if (values.lastName !== before.lastName) {
		payload.lastName = values.lastName;
	}

	// Clearing a date is not something the endpoint offers, so an emptied one is left as it was.
	if (values.dateOfBirth !== before.dateOfBirth && values.dateOfBirth !== '') {
		payload.dateOfBirth = values.dateOfBirth;
	}

	if (values.joinedStudioAt !== before.joinedStudioAt && values.joinedStudioAt !== '') {
		payload.joinedStudioAt = values.joinedStudioAt;
	}

	// Unlike the dates above, these two can be emptied - but only by asking for it by name.
	if (values.joinedClubDate !== before.joinedClubDate) {
		if (values.joinedClubDate === '') {
			payload.clearJoinedClubDate = true;
		} else {
			payload.joinedClubDate = values.joinedClubDate;
		}
	}

	if (values.leftClubDate !== before.leftClubDate) {
		if (values.leftClubDate === '') {
			payload.clearLeftClubDate = true;
		} else {
			payload.leftClubDate = values.leftClubDate;
		}
	}

	if (values.phone !== phoneDigits(before.phone)) {
		payload.phone = values.phone;
	}

	if (values.email !== before.email) {
		payload.email = values.email;
	}

	if (values.active !== before.active) {
		payload.active = values.active;
	}

	if (values.contractSigned !== before.contractSigned) {
		payload.contractSigned = values.contractSigned;
	}

	if (values.studentDiscount !== before.studentDiscount) {
		payload.studentDiscount = values.studentDiscount;
	}

	if (values.note !== before.note) {
		payload.note = values.note;
	}

	if (values.familyId !== before.familyId) {
		// A null id is ignored by the backend, so detaching has to be asked for by name.
		if (values.familyId === '') {
			payload.clearFamily = true;
		} else {
			payload.familyId = values.familyId;
		}
	}

	return payload;
}
