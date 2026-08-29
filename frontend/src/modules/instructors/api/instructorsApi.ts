import { axiosInstance } from '@/api/axiosInstance';
import { INSTRUCTOR_ENDPOINTS } from '@/api/endpoints';
import type { CreateInstructorPayload, InstructorView, UpdateInstructorPayload } from '../types/types.ts';


export async function fetchInstructors(): Promise<InstructorView[]> {
	const { data } = await axiosInstance.get<InstructorView[]>(INSTRUCTOR_ENDPOINTS.base);

	return data;
}


export async function createInstructor(payload: CreateInstructorPayload): Promise<InstructorView> {
	const { data } = await axiosInstance.post<InstructorView>(INSTRUCTOR_ENDPOINTS.base, payload);

	return data;
}


export async function updateInstructor(id: string, payload: UpdateInstructorPayload): Promise<InstructorView> {
	const { data } = await axiosInstance.patch<InstructorView>(INSTRUCTOR_ENDPOINTS.byId(id), payload);

	return data;
}


export async function deleteInstructor(id: string): Promise<void> {
	await axiosInstance.delete(INSTRUCTOR_ENDPOINTS.byId(id));
}
