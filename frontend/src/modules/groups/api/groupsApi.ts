import { axiosInstance } from '@/api/axiosInstance';
import { DOCUMENT_TIMEOUT_MS } from '@/api/config';
import { GROUP_ENDPOINTS } from '@/api/endpoints';
import { type DownloadedFile, fileNameFromDisposition } from '@/lib/download';
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


export async function getAttendanceList(groupId: string, onTransferStart?: () => void): Promise<DownloadedFile> {
	let announced = false;

	const response = await axiosInstance.get<Blob>(GROUP_ENDPOINTS.attendanceList(groupId), {
		responseType: 'blob',
		timeout: DOCUMENT_TIMEOUT_MS,
		headers: { Accept: 'application/pdf, application/json' },

		onDownloadProgress: () => {
			if (!announced) {
				announced = true;
				onTransferStart?.();
			}
		},
	});

	return {
		blob: response.data,
		fileName: fileNameFromDisposition(response.headers['content-disposition']) ?? 'lista-obecnosci.pdf',
	};
}