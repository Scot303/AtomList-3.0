import type { ExtendedSelectOption } from '@/components/ui/extendedSelect';
import type { TagColor, TagOption, TagRecord } from '@/components/ui/tags';
import { tagOptions } from '@/components/ui/tags';
import { type Permission, PERMISSIONS, type Role } from '@/types/auth.ts';
import { ACTIVE_ID, ACTIVE_TAGS, type ActiveTag, INACTIVE_ID } from '@/types/rowTags.ts';


/**
 * The order the list shows roles in - most privileged first.
 */
export const ROLE_ORDER: readonly Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'RECEPTIONIST', 'BASIC'];

export const ROLE_LABELS: Record<Role, string> = {
	ADMIN: 'Administrator',
	MANAGER: 'Menedżer',
	EMPLOYEE: 'Pracownik',
	RECEPTIONIST: 'Recepcjonista',
	BASIC: 'Podstawowy',
};

/** Warmer colors carry more authority, so a glance down the list reads as a gradient of it. */
export const ROLE_COLORS: Record<Role, TagColor> = {
	ADMIN: 'rose',
	MANAGER: 'violet',
	EMPLOYEE: 'sky',
	RECEPTIONIST: 'teal',
	BASIC: 'slate',
};

export const ROLE_OPTIONS: TagOption[] = ROLE_ORDER.map((role) => ( {
	id: role,
	name: ROLE_LABELS[role],
	color: ROLE_COLORS[role],
} ));

/** The same colors groups and persons use for the same state - only the Polish differs, for a masculine noun. */
export const USER_ACTIVE_TAGS: TagRecord<ActiveTag> = {
	[ACTIVE_ID]: { ...ACTIVE_TAGS[ACTIVE_ID], name: 'Aktywny' },
	[INACTIVE_ID]: { ...ACTIVE_TAGS[INACTIVE_ID], name: 'Nieaktywny' },
};

export const ACTIVE_OPTIONS: TagOption[] = tagOptions(USER_ACTIVE_TAGS);

export const PERMISSION_LABELS: Record<Permission, string> = {
	MANAGE_USERS: 'Zarządzanie użytkownikami',
	READ_LOGS: 'Podgląd logów',
	VIEW_STATS: 'Podgląd statystyk',
	READ_DISCOUNTS: 'Podgląd zniżek',
	MODIFY_DISCOUNTS: 'Edycja zniżek',
	READ_LISTS: 'Podgląd list',
	MODIFY_LISTS: 'Edycja list',
	CLOSE_LISTS: 'Zamykanie list',
	READ_PAYMENTS: 'Podgląd płatności',
	MODIFY_PAYMENTS: 'Edycja płatności',
	READ_GROUPS: 'Podgląd grup',
	MODIFY_GROUPS: 'Edycja grup',
	READ_INCOME_TRANSACTIONS: 'Podgląd przychodów',
	MODIFY_INCOME_TRANSACTIONS: 'Edycja przychodów',
	READ_EXPENSE_TRANSACTIONS: 'Podgląd wydatków',
	MODIFY_EXPENSE_TRANSACTIONS: 'Edycja wydatków',
	READ_INSTRUCTORS: 'Podgląd instruktorów',
	MODIFY_INSTRUCTORS: 'Edycja instruktorów',
	READ_PERSONS: 'Podgląd osób',
	MODIFY_PERSONS: 'Edycja osób',
	READ_FAMILIES: 'Podgląd rodzin',
	MODIFY_FAMILIES: 'Edycja rodzin',
	READ_SMS: 'Wyświetlanie SMS',
	SEND_SMS: 'Wysyłanie SMS',
	PRINT_ATTENDANCE: 'Drukowanie list obecności',
};

/** All of them, in the order the backend declares them, which groups related ones together. */
export const PERMISSION_ORDER: readonly Permission[] = PERMISSIONS;

/**
 * Every permission, selectable. A row showing an existing account locks the ones its role already
 * grants on top of these - see {@link '@/modules/users/components/UserRow'}.
 */
export const PERMISSION_OPTIONS: ExtendedSelectOption[] = PERMISSION_ORDER.map((permission) => ( {
	id: permission,
	name: PERMISSION_LABELS[permission],
} ));
