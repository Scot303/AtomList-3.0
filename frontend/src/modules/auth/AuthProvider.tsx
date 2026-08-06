import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { ApiError } from '@/api/errors';
import { notifySessionExpired } from '@/lib/toast';
import type { LoginResponse, Permission, UserInfo } from '@/types/auth';

import { fetchCurrentUser, logoutEverywhere } from './api/authApi';
import { authKeys } from './api/authKeys';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';
import { bootstrapSession, endSession, onSessionEnded, signOut as endSessionOnServer, startSession, watchSession, } from './session';
import { useAuthStore } from './stores/authStore';

/**
 * Holds the answer to "who is using this, and are they still allowed to".
 *
 * The two halves are kept apart on purpose: the access token is client state and lives in a store
 * the axios interceptors can read synchronously, while the user is server state and lives in the
 * query cache, refetchable like anything else.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const queryClient = useQueryClient();
	const accessToken = useAuthStore((state) => state.accessToken);
	const [bootstrapped, setBootstrapped] = useState(false);

	// Startup: the access token only ever lived in memory, so a reload arrives with nothing. If this
	// browser holds a refresh cookie, this is where it is spent for a new one.
	useEffect(() => {
		const stopWatching = watchSession();
		let abandoned = false;

		void bootstrapSession().finally(() => {
			if (!abandoned) {
				setBootstrapped(true);
			}
		});

		return () => {
			abandoned = true;
			stopWatching();
		};
	}, []);

	useEffect(
		() =>
			onSessionEnded((reason) => {
				queryClient.clear();

				// Being dropped back on the sign-in page mid-task reads as the application breaking unless it says why.
				// Someone who chose to sign out already knows why.
				if (reason === 'expired') {
					notifySessionExpired();
				}
			}),
		[queryClient],
	);

	const userQuery = useQuery<UserInfo, ApiError>({
		queryKey: authKeys.me(),
		queryFn: fetchCurrentUser,
		enabled: accessToken !== null,
		staleTime: 5 * 60_000,
		meta: { silent: true },
	});

	const user = userQuery.data ?? null;

	const status: AuthStatus = useMemo(() => {
		if (!bootstrapped) {
			return 'initializing';
		}

		if (accessToken === null) {
			return 'unauthenticated';
		}

		if (user !== null) {
			return 'authenticated';
		}

		// Token in hand but no user yet: still loading, unless the load failed outright.
		if (!userQuery.isError) {
			return 'initializing';
		}

		// Only a 401 says the session is over, and by this point it has survived the interceptor's
		// renew-and-retry, so it is the server's final word. Everything else - a 500, a timeout, no
		// network - says nothing about the session, and throwing it away would make the user sign in
		// again to fix a problem that was never theirs.
		return userQuery.error.status === 401 ? 'unauthenticated' : 'unavailable';
	}, [accessToken, bootstrapped, user, userQuery.error, userQuery.isError]);

	const permissions = useMemo(() => new Set<Permission>(user?.permissions ?? []), [user]);

	const signIn = useCallback(
		(response: LoginResponse) => {
			startSession(response.token);
			queryClient.setQueryData(authKeys.me(), response.user);
		},
		[queryClient],
	);

	const signOut = useCallback(async () => {
		await endSessionOnServer();
	}, []);

	const signOutEverywhere = useCallback(async () => {
		try {
			await logoutEverywhere();
		} finally {
			endSession('signed-out');
		}
	}, []);

	const reloadUser = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: authKeys.me() });
	}, [queryClient]);

	const value = useMemo<AuthContextValue>(
		() => ({
			status,
			user,
			isAuthenticated: status === 'authenticated',
			hasPermission: (permission) => permissions.has(permission),
			hasAnyPermission: (required) =>
				required.length === 0 || required.some((permission) => permissions.has(permission)),
			signIn,
			signOut,
			signOutEverywhere,
			reloadUser,
		}),
		[permissions, reloadUser, signIn, signOut, signOutEverywhere, status, user],
	);

	return <AuthContext.Provider value={ value }>{ children }</AuthContext.Provider>;
}
