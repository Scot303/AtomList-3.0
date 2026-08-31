import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyApiError, notifySuccess } from '@/lib/toast';
import { createUser, forceLogout, resendVerification, unlockUser, updateUser } from '../api/adminUsersApi';
import { adminUserKeys } from '../api/userKeys';
import type { AdminUserView, UpdateUserPayload } from '../types/types.ts';

export interface UpdateUserVariables {
	id: string;
	payload: UpdateUserPayload;
}

/** Drops the authoritative version of a row the backend just handed back into the cached list. */
function replaceUser(queryClient: QueryClient, updated: AdminUserView): void {
	queryClient.setQueryData<AdminUserView[]>(adminUserKeys.list(), (users) =>
		users?.map((user) => (user.id === updated.id ? updated : user)),
	);
}

/**
 * The change the backend is about to make, applied locally so an inline control answers the click rather than the round trip.
 */
function applyPayload(user: AdminUserView, payload: UpdateUserPayload): AdminUserView {
	const next: AdminUserView = { ...user };

	if (payload.username !== undefined) {
		next.username = payload.username;
	}

	if (payload.email !== undefined) {
		next.email = payload.email;

		// A new address has to be confirmed again before the account can sign in.
		next.emailVerified = false;
	}

	if (payload.active !== undefined) {
		next.active = payload.active;
	}

	if (payload.role !== undefined) {
		// What the new role itself grants is only known to the backend,
		// so `effectivePermissions` stays as it was until the response lands and corrects it.
		next.role = payload.role;
	}

	if (payload.additionalPermissions !== undefined) {
		// Whatever the role grants is unaffected by this edit, so the effective set is exact here.
		const roleGranted = user.effectivePermissions.filter(
			(permission) => !user.additionalPermissions.includes(permission),
		);

		next.additionalPermissions = payload.additionalPermissions;
		next.effectivePermissions = [...new Set([...roleGranted, ...payload.additionalPermissions])].sort();
	}

	return next;
}

/**
 * Partial update of one account. Applies the change immediately and puts the row back as it was if the backend refuses it.
 */
export function useUpdateUser() {
	const queryClient = useQueryClient();

	// The rollback context is whatever `onMutate` returns, so it is inferred rather than declared.
	return useMutation({
		mutationFn: ({ id, payload }: UpdateUserVariables) => updateUser(id, payload),

		onMutate: async ({ id, payload }) => {
			// An in-flight refetch landing later would undo the change we are about to show.
			await queryClient.cancelQueries({ queryKey: adminUserKeys.list() });

			const previous = queryClient.getQueryData<AdminUserView[]>(adminUserKeys.list());

			queryClient.setQueryData<AdminUserView[]>(adminUserKeys.list(), (users) =>
				users?.map((user) => (user.id === id ? applyPayload(user, payload) : user)),
			);

			return { previous };
		},

		onSuccess: (updated) => replaceUser(queryClient, updated),

		// Reporting is left to the caller
		onError: (_error, _variables, context) => {
			if (context?.previous !== undefined) {
				queryClient.setQueryData(adminUserKeys.list(), context.previous);
			}
		},
	});
}


export function useCreateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createUser,

		// Awaited, so the form closes onto a list that already has the account in it.
		onSuccess: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
	});
}


export function useUnlockUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: unlockUser,
		onSuccess: (updated) => {
			replaceUser(queryClient, updated);
			notifySuccess('Konto zostało odblokowane.');
		},
		onError: notifyApiError,
	});
}


export function useResendVerification() {
	return useMutation({
		mutationFn: resendVerification,
		onSuccess: () => notifySuccess('Link weryfikacyjny został ponownie wysłany.'),
		onError: notifyApiError,
	});
}

/**
 * Signs an account out everywhere.
 */
export function useForceLogout() {
	return useMutation({
		mutationFn: forceLogout,
		onSuccess: () => notifySuccess('Wszystkie sesje konta zostały zakończone.'),
		onError: notifyApiError,
	});
}
