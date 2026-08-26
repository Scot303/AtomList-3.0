import type { FamilyFormValues } from '../schemas/familySchemas';
import type { CreateUpdateFamilyPayload } from '../types/types.ts';


export function toFamilyPayload(values: FamilyFormValues): CreateUpdateFamilyPayload {
	const payload: CreateUpdateFamilyPayload = { name: values.name };

	if (values.phone !== '') {
		payload.phone = values.phone;
	}

	if (values.note !== '') {
		payload.note = values.note;
	}

	return payload;
}
