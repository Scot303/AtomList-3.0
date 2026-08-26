import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LOCALE } from '@/lib/locale';
import { paymentListKeys } from '@/modules/paymentLists/api/paymentListKeys';
import { createFamily, deleteFamily, setFamilyMembers, updateFamily } from '../api/familiesApi';
import { familyKeys, personKeys } from '../api/personKeys';
import type { CreateUpdateFamilyPayload, FamilyView } from '../types/types.ts';


/* ------------------ INVALIDATE ------------------ */

function useFamilyInvalidation() {
	const queryClient = useQueryClient();

	return () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: familyKeys.list() }),
			queryClient.invalidateQueries({ queryKey: personKeys.list() }),
		]);
}


function useRosterInvalidation() {
	const queryClient = useQueryClient();
	const invalidateFamily = useFamilyInvalidation();

	return () =>
		Promise.all([
			invalidateFamily(),
			queryClient.invalidateQueries({ queryKey: personKeys.discounts() }),
			queryClient.invalidateQueries({ queryKey: paymentListKeys.all }),
		]);
}


/* ------------------ CREATE ------------------ */

export function useCreateFamily() {
	const queryClient = useQueryClient();
	const invalidate = useFamilyInvalidation();

	return useMutation({
		mutationFn: (payload: CreateUpdateFamilyPayload) => createFamily(payload),

		onSuccess: (family) => {
			// The picker that opened the form selects the household by id, and needs the option to be there to show it.
			queryClient.setQueryData<FamilyView[]>(familyKeys.list(), (families) =>
				families === undefined ? undefined : [...families, family].sort((left, right) => left.name.localeCompare(right.name, LOCALE)),
			);

			return invalidate();
		},
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdateFamilyVariables {
	id: string;
	payload: CreateUpdateFamilyPayload;
}


export function useUpdateFamily() {
	const invalidate = useFamilyInvalidation();

	return useMutation({
		mutationFn: ({ id, payload }: UpdateFamilyVariables) => updateFamily(id, payload),
		onSuccess: invalidate,
	});
}


/* ------------------ MEMBERS ------------------ */

export interface SetFamilyMembersVariables {
	id: string;
	/** The roster as it should end up, not the change to it. */
	personIds: string[];
}


export function useSetFamilyMembers() {
	const invalidate = useRosterInvalidation();

	return useMutation({
		mutationFn: ({ id, personIds }: SetFamilyMembersVariables) => setFamilyMembers(id, personIds),
		onSuccess: invalidate,
	});
}


/* ------------------ DELETE ------------------ */

export function useDeleteFamily() {
	const invalidate = useFamilyInvalidation();

	return useMutation({
		mutationFn: (id: string) => deleteFamily(id),
		onSuccess: invalidate,
	});
}
