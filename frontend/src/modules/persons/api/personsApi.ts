import { axiosInstance } from '@/api/axiosInstance';
import { PERSON_ENDPOINTS } from '@/api/endpoints';
import type { CreatePersonPayload, PersonArrearsView, PersonDiscountView, PersonView, UpdatePersonPayload } from '../types/types.ts';


export async function fetchPersons(): Promise<PersonView[]> {
	const { data } = await axiosInstance.get<PersonView[]>(PERSON_ENDPOINTS.base);

	return data;
}


export async function fetchPersonDiscounts(personId: string): Promise<PersonDiscountView> {
	const { data } = await axiosInstance.get<PersonDiscountView>(PERSON_ENDPOINTS.discounts(personId));

	return data;
}


export async function fetchPersonArrears(personId: string): Promise<PersonArrearsView> {
	const { data } = await axiosInstance.get<PersonArrearsView>(PERSON_ENDPOINTS.arrears(personId));

	return data;
}


export async function createPerson(payload: CreatePersonPayload): Promise<PersonView> {
	const { data } = await axiosInstance.post<PersonView>(PERSON_ENDPOINTS.base, payload);

	return data;
}


/** Sends only the fields being changed. */
export async function updatePerson(id: string, payload: UpdatePersonPayload): Promise<PersonView> {
	const { data } = await axiosInstance.patch<PersonView>(PERSON_ENDPOINTS.byId(id), payload);

	return data;
}
