import { axiosInstance } from '@/api/axiosInstance';
import { GROUP_ENDPOINTS } from '@/api/endpoints';
import type { GroupView } from '../types/types.ts';

/**
 * Groups, for the persons table's tag options and the membership form's picker.
 * Inactive groups included: people still hold memberships in groups that have been retired.
 */
export async function fetchGroups(): Promise<GroupView[]> {
	const { data } = await axiosInstance.get<GroupView[]>(GROUP_ENDPOINTS.base);

	return data;
}
