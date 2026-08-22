import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPerson, updatePerson } from '../api/personsApi';
import { personKeys } from '../api/personKeys';
import type { CreatePersonPayload, PersonView, UpdatePersonPayload } from '../types/types.ts';


/* ------------------ CREATE ------------------ */

export function useCreatePerson() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreatePersonPayload) => createPerson(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: personKeys.list() }),
	});
}


/* ------------------ UPDATE ------------------ */

export interface UpdatePersonVariables {
	id: string;
	payload: UpdatePersonPayload;
}


/**
 * Partial update of one person. Applies the change immediately and puts the row back as it was if the backend refuses it.
 */
export function useUpdatePerson() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, payload }: UpdatePersonVariables) => updatePerson(id, payload),

		onMutate: async ({ id, payload }) => {
			// An in-flight refetch landing later would undo the change we are about to show.
			await queryClient.cancelQueries({ queryKey: personKeys.list() });

			const previous = queryClient.getQueryData<PersonView[]>(personKeys.list());

			queryClient.setQueryData<PersonView[]>(personKeys.list(), (persons) =>
				persons?.map((person) => ( person.id === id ? applyPayload(person, payload) : person )),
			);

			return { previous };
		},

		onSuccess: (updated) => replacePerson(queryClient, updated),

		onError: (_error, _variables, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(personKeys.list(), context.previous);
			}
		},
	});
}


/* ------------------ INNER METHODS ------------------ */

/** Drops the authoritative version of a row the backend just handed back into the cached list. */
function replacePerson(queryClient: QueryClient, updated: PersonView): void {
	queryClient.setQueryData<PersonView[]>(personKeys.list(), (persons) =>
		persons?.map((person) => ( person.id === updated.id ? updated : person )),
	);
}


/**
 * The change the backend is about to make, applied locally so an in-place cell answers the click rather than the round trip.
 */
function applyPayload(person: PersonView, payload: UpdatePersonPayload): PersonView {
	const next: PersonView = { ...person };

	if (payload.name !== undefined) {
		next.name = payload.name;
	}

	if (payload.lastName !== undefined) {
		next.lastName = payload.lastName;
	}

	if (payload.name !== undefined || payload.lastName !== undefined) {
		next.fullName = `${ next.name } ${ next.lastName }`;
	}

	if (payload.phone !== undefined) {
		next.phone = payload.phone === '' ? null : payload.phone;
		next.effectivePhone = next.phone;
	}

	if (payload.email !== undefined) {
		next.email = payload.email === '' ? null : payload.email;
	}

	if (payload.dateOfBirth !== undefined) {
		next.dateOfBirth = payload.dateOfBirth;
	}

	if (payload.joinedStudioAt !== undefined) {
		next.joinedStudioAt = payload.joinedStudioAt;
	}

	if (payload.active !== undefined) {
		next.active = payload.active;
	}

	if (payload.contractSigned !== undefined) {
		next.contractSigned = payload.contractSigned;
	}

	if (payload.note !== undefined) {
		next.note = payload.note === '' ? null : payload.note;
	}


	return next;
}