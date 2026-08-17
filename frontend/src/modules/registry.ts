import type { ComponentType } from 'react';
import { ListChecks, type LucideIcon, UserRound, UserShield, UsersRound, Wallet } from 'lucide-react';

import { paths } from '@/routes/paths';
import type { Permission } from '@/types/auth';

import { DepositsPage } from './deposits/DepositsPage.tsx';
import { GroupsPage } from './groups/GroupsPage.tsx';
import { PaymentListsPage } from './paymentLists/PaymentListsPage.tsx';
import { PersonsPage } from './persons/PersonsPage.tsx';
import { UsersPage } from './users/UsersPage.tsx';


export interface AppModule {
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
		id: 'deposits',
		label: 'Wpłaty',
		path: paths.deposits,
		icon: Wallet,
		permissions: ['READ_PAYMENTS'],
		Component: DepositsPage,
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
		id: 'groups',
		label: 'Grupy',
		path: paths.groups,
		icon: UsersRound,
		permissions: ['READ_GROUPS'],
		Component: GroupsPage,
	},
	{
		id: 'users',
		label: 'Zarządzanie użytkownikami',
		path: paths.users,
		icon: UserShield,
		permissions: ['MANAGE_USERS'],
		Component: UsersPage,
	},
];
