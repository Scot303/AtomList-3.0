import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionKeys } from '@/modules/transactions/api/transactionKeys.ts';
import { createInstructor, deleteInstructor, updateInstructor } from '../api/instructorsApi.ts';
import { instructorKeys } from '../api/instructorKeys.ts';
import type { CreateInstructorPayload, InstructorView, UpdateInstructorPayload } from '../types/types.ts';


/* ------------------ CREATE ------------------ */

export function useCreateInstructor() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateInstructorPayload) => createInstructor(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: instructorKeys.list() }),
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdateInstructorVariables {
	id: string;
	payload: UpdateInstructorPayload;
}


export function useUpdateInstructor() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateInstructorVariables) => updateInstructor(id, payload),

		onMutate: async ({ id, payload }) => {
			await queryClient.cancelQueries({ queryKey: instructorKeys.list() });

			const previous = queryClient.getQueryData<InstructorView[]>(instructorKeys.list());

			queryClient.setQueryData<InstructorView[]>(instructorKeys.list(), (instructors) =>
				instructors?.map((instructor) => ( instructor.id === id ? { ...instructor, ...payload } : instructor )),
			);

			return { previous };
		},

		onSuccess: (updated) => replaceInstructor(queryClient, updated),

		onError: (_error, _variables, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(instructorKeys.list(), context.previous);
			}
		},
	});
}


/* ------------------ DELETE ------------------ */

export function useDeleteInstructor() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteInstructor(id),

		onSuccess: (_result, id) => {
			queryClient.setQueryData<InstructorView[]>(instructorKeys.list(), (instructors) =>
				instructors?.filter((instructor) => instructor.id !== id),
			);

			void queryClient.invalidateQueries({ queryKey: instructorKeys.list() });
			void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
		},
	});
}


/* ------------------ REPLACE ------------------ */

function replaceInstructor(queryClient: QueryClient, updated: InstructorView): void {
	queryClient.setQueryData<InstructorView[]>(instructorKeys.list(), (instructors) =>
		instructors?.map((instructor) => ( instructor.id === updated.id ? updated : instructor )),
	);
}
