import type { Permission, Role } from '@/types/auth.ts';

/**
 * Mirror of the backend's `AdminUserView`.
 */
export interface AdminUserView {
	id: string;
	username: string;
	email: string;
	role: Role;
	/** Granted on top of the role. */
	additionalPermissions: Permission[];
	/** The role's permissions and the additional ones together - what the account can actually do. */
	effectivePermissions: Permission[];
	active: boolean;
	emailVerified: boolean;
	locked: boolean;
	lockedUntil: string | null;
	failedLoginAttempts: number;
	lastLoginAt: string | null;
}

/**
 * Nothing optional here - unlike an edit, a new account has to say what it is from the start.
 */
export interface CreateUserPayload {
	username: string;
	email: string;
	role: Role;
	additionalPermissions: Permission[];
}

/** Every field is optional: the backend leaves a `null` one alone. */
export interface UpdateUserPayload {
	username?: string;
	email?: string;
	role?: Role;
	additionalPermissions?: Permission[];
	active?: boolean;
}
