import { createContext } from 'react'

import type { LoginResponse, Permission, UserInfo } from '@/types/auth'

export type AuthStatus =
	| 'initializing'
	| 'authenticated'
	| 'unauthenticated'
	| 'unavailable'

export interface AuthContextValue {
	status: AuthStatus;
	user: UserInfo | null;
	isAuthenticated: boolean;
	hasPermission: (permission: Permission) => boolean;
	/** True when the user holds at least one of them, or when none are required. */
	hasAnyPermission: (permissions: readonly Permission[]) => boolean;
	/** Adopts the session handed back by /api/auth/otp/verify. */
	signIn: (response: LoginResponse) => void;
	signOut: () => Promise<void>;
	/** Ends every session the account holds, on every device. */
	signOutEverywhere: () => Promise<void>;
	/** Re-reads the user, for when something may have changed their permissions. */
	reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
