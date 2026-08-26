/**
 * Mirrors of the auth payloads the backend sends.
 */

export const PERMISSIONS = [
	'MANAGE_USERS',
	'READ_LOGS',
	'VIEW_STATS',
	'READ_DISCOUNTS',
	'MODIFY_DISCOUNTS',
	'READ_LISTS',
	'MODIFY_LISTS',
	'CLOSE_LISTS',
	'READ_PAYMENTS',
	'MODIFY_PAYMENTS',
	'READ_GROUPS',
	'MODIFY_GROUPS',
	'READ_INCOME_TRANSACTIONS',
	'MODIFY_INCOME_TRANSACTIONS',
	'READ_EXPENSE_TRANSACTIONS',
	'MODIFY_EXPENSE_TRANSACTIONS',
	'READ_INSTRUCTORS',
	'MODIFY_INSTRUCTORS',
	'READ_PERSONS',
	'MODIFY_PERSONS',
	'READ_FAMILIES',
	'MODIFY_FAMILIES',
	'READ_SMS',
	'SEND_SMS',
	'PRINT_ATTENDANCE',
] as const;

export type Permission = ( typeof PERMISSIONS )[number];

export const ROLES = ['BASIC', 'RECEPTIONIST', 'EMPLOYEE', 'MANAGER', 'ADMIN'] as const;

export type Role = ( typeof ROLES )[number];


/** GET /api/auth/me */
export interface UserInfo {
	id: string;
	username: string;
	email: string;
	role: Role;
	permissions: Permission[];
	emailVerified: boolean;
}


/** POST /api/auth/otp/verify */
export interface LoginResponse {
	token: string;
	user: UserInfo;
}


/** POST /api/auth/refresh */
export interface TokenResponse {
	token: string;
}
