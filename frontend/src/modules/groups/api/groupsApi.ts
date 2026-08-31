import { axiosInstance } from '@/api/axiosInstance';
import { GROUP_ENDPOINTS } from '@/api/endpoints';
import { fileNameFromDisposition } from '@/lib/download';
import type { CreateGroupPayload, GroupView, UpdateGroupPayload } from '../types/types.ts';


export async function fetchGroups(): Promise<GroupView[]> {
	const { data } = await axiosInstance.get<GroupView[]>(GROUP_ENDPOINTS.base);

	return data;
}


export async function createGroup(payload: CreateGroupPayload): Promise<GroupView> {
	const { data } = await axiosInstance.post<GroupView>(GROUP_ENDPOINTS.base, payload);

	return data;
}


export async function updateGroup(id: string, payload: UpdateGroupPayload): Promise<GroupView> {
	const { data } = await axiosInstance.patch<GroupView>(GROUP_ENDPOINTS.byId(id), payload);

	return data;
}


export interface AttendancePdf {
	blob: Blob;
	fileName: string;
}


export async function getAttendanceList(groupId: string): Promise<AttendancePdf> {
	const response = await axiosInstance.get<Blob>(GROUP_ENDPOINTS.attendanceList(groupId), {
		responseType: 'blob',
		headers: { Accept: 'application/pdf, application/json' },
	});

	return {
		blob: response.data,
		fileName: fileNameFromDisposition(response.headers['content-disposition']) ?? 'lista-obecnosci.pdf',
	};
}