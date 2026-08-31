import { axiosInstance } from '@/api/axiosInstance';
import { FAMILY_ENDPOINTS } from '@/api/endpoints';
import type { CreateUpdateFamilyPayload, FamilyView } from '../types/types.ts';


export async function fetchFamilies(): Promise<FamilyView[]> {
	const { data } = await axiosInstance.get<FamilyView[]>(FAMILY_ENDPOINTS.base);

	return data;
}


export async function createFamily(payload: CreateUpdateFamilyPayload): Promise<FamilyView> {
	const { data } = await axiosInstance.post<FamilyView>(FAMILY_ENDPOINTS.base, payload);

	return data;
}


export async function updateFamily(id: string, payload: CreateUpdateFamilyPayload): Promise<FamilyView> {
	const { data } = await axiosInstance.patch<FamilyView>(FAMILY_ENDPOINTS.byId(id), payload);

	return data;
}


export async function setFamilyMembers(id: string, personIds: string[]): Promise<FamilyView> {
	const { data } = await axiosInstance.put<FamilyView>(FAMILY_ENDPOINTS.members(id), personIds);

	return data;
}


export async function deleteFamily(id: string): Promise<void> {
	await axiosInstance.delete(FAMILY_ENDPOINTS.byId(id));
}
