import { axiosInstance } from '@/api/axiosInstance';
import { FAMILY_ENDPOINTS } from '@/api/endpoints';
import type { FamilyView } from '../types/types.ts';

/** Households, for the family picker on the person form. Needs `READ_FAMILIES`. */
export async function fetchFamilies(): Promise<FamilyView[]> {
	const { data } = await axiosInstance.get<FamilyView[]>(FAMILY_ENDPOINTS.base);

	return data;
}
