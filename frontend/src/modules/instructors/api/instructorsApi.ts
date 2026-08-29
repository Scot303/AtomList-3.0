import { axiosInstance } from '@/api/axiosInstance';
import { INSTRUCTOR_ENDPOINTS } from '@/api/endpoints';
import type { InstructorView } from '../types/types.ts';


export async function fetchInstructors(): Promise<InstructorView[]> {
	const { data } = await axiosInstance.get<InstructorView[]>(INSTRUCTOR_ENDPOINTS.base);

	return data;
}
