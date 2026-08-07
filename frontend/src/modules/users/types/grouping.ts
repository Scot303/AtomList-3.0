import { ROLE_ORDER } from './constants.ts';
import type { AdminUserView } from './types.ts';
import type { Role } from '@/types/auth.ts';

export interface UserRoleGroupData {
	role: Role;
	users: AdminUserView[];
}

/**
 * Splits the roster into one section per role, in {@link ROLE_ORDER}, dropping roles nobody holds.
 */
export function groupUsersByRole(users: AdminUserView[]): UserRoleGroupData[] {
	return ROLE_ORDER
		.map((role) => ({ role, users: users.filter((user) => user.role === role) }))
		.filter((group) => group.users.length > 0);
}
