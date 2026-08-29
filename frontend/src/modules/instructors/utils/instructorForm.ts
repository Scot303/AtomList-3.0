import { type InstructorFormValues, parseCost } from '../schemas/instructorSchemas.ts';
import type { CreateInstructorPayload, InstructorView, UpdateInstructorPayload } from '../types/types.ts';


export function blankInstructorForm(): InstructorFormValues {
	return {
		name: '',
		lastName: '',
		costPerHour: '',
		contractType: 'OPEN',
		contractSignedDate: '',
		contractNumber: '',
		active: true,
		note: '',
	};
}


export function instructorToForm(instructor: InstructorView): InstructorFormValues {
	return {
		name: instructor.name,
		lastName: instructor.lastName,
		costPerHour: String(instructor.costPerHour),
		contractType: instructor.contractType,
		contractSignedDate: instructor.contractSignedDate ?? '',
		contractNumber: instructor.contractNumber ?? '',
		active: instructor.active,
		note: instructor.note ?? '',
	};
}


export function buildCreatePayload(values: InstructorFormValues): CreateInstructorPayload {
	const payload: CreateInstructorPayload = {
		name: values.name,
		lastName: values.lastName,
		costPerHour: parseCost(values.costPerHour),
		contractType: values.contractType,
	};

	if (values.contractSignedDate !== '') {
		payload.contractSignedDate = values.contractSignedDate;
	}

	if (values.contractNumber !== '') {
		payload.contractNumber = values.contractNumber;
	}

	if (values.note !== '') {
		payload.note = values.note;
	}

	return payload;
}


export function buildUpdatePayload(values: InstructorFormValues, instructor: InstructorView): UpdateInstructorPayload {
	const before = instructorToForm(instructor);
	const payload: UpdateInstructorPayload = {};

	if (values.name !== before.name) {
		payload.name = values.name;
	}

	if (values.lastName !== before.lastName) {
		payload.lastName = values.lastName;
	}

	// Compared as numbers, so re-typing `80.00` over `80` is not a change worth sending.
	if (parseCost(values.costPerHour) !== parseCost(before.costPerHour)) {
		payload.costPerHour = parseCost(values.costPerHour);
	}

	if (values.contractType !== before.contractType) {
		payload.contractType = values.contractType;
	}

	if (values.contractSignedDate !== before.contractSignedDate && values.contractSignedDate !== '') {
		payload.contractSignedDate = values.contractSignedDate;
	}

	if (values.contractNumber !== before.contractNumber) {
		payload.contractNumber = values.contractNumber;
	}

	if (values.active !== before.active) {
		payload.active = values.active;
	}

	if (values.note !== before.note) {
		payload.note = values.note;
	}

	return payload;
}
