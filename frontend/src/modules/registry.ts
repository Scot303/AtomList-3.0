import type { ComponentType } from 'react';
import { ListChecks, type LucideIcon, UserRound, Users } from 'lucide-react';

import { paths } from '@/routes/paths';
import type { Permission } from '@/types/auth';

import { PaymentListsPage } from './paymentLists/PaymentListsPage.tsx';
import { PersonsPage } from './persons/PersonsPage.tsx';
import { UsersPage } from './users/UsersPage.tsx';

export interface AppModule {
	/** Stable identity, independent of the path - which is only ever a URL and may be renamed. */
	id: string;
	/** As it appears in the sidebar, and as the page title in the top bar. */
	label: string;
	path: string;
	icon: LucideIcon;
	/** Any one of these is enough to reach the module. An empty list means everybody. */
	permissions: readonly Permission[];
	/** The screen itself. Rendered inside the dashboard shell. */
	Component: ComponentType;
}

/**
 * Every module the application has, in the order they appear in the sidebar.
 *
 * Adding a module is a path in routes/paths and an entry here. Nothing else.
 */
export const MODULES: readonly AppModule[] = [
	{
		id: 'payment-lists',
		label: 'Listy płatności',
		path: paths.paymentLists,
		icon: ListChecks,
		permissions: ['READ_LISTS'],
		Component: PaymentListsPage,
	},
	{
		id: 'persons',
		label: 'Osoby',
		path: paths.persons,
		icon: UserRound,
		permissions: ['READ_PERSONS'],
		Component: PersonsPage,
	},
	{
		id: 'users',
		label: 'Zarządzanie użytkownikami',
		path: paths.users,
		icon: Users,
		permissions: ['MANAGE_USERS'],
		Component: UsersPage,
	},
];
