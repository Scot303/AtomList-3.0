import { axiosInstance } from '@/api/axiosInstance';
import { PERSON_ENDPOINTS } from '@/api/endpoints';
import type { PersonView, UpdatePersonPayload } from '../types/types.ts';


export async function fetchPersons(): Promise<PersonView[]> {
	const { data } = await axiosInstance.get<PersonView[]>(PERSON_ENDPOINTS.base);

	return data;
}

/** Sends only the fields being changed. */
export async function updatePerson(id: string, payload: UpdatePersonPayload): Promise<PersonView> {
	const { data } = await axiosInstance.patch<PersonView>(PERSON_ENDPOINTS.byId(id), payload);

	return data;
}
