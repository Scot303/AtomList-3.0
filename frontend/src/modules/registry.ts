import type { ComponentType } from 'react';
import { Calculator, GraduationCap, ListChecks, type LucideIcon, MessageSquare, UserRound, UserShield, UsersRound, Wallet } from 'lucide-react';

import { paths } from '@/routes/paths';
import type { Permission } from '@/types/auth';

import { DepositsPage } from './deposits/DepositsPage.tsx';
import { GroupsPage } from './groups/GroupsPage.tsx';
import { InstructorsPage } from './instructors/InstructorsPage.tsx';
import { PaymentListsPage } from './paymentLists/PaymentListsPage.tsx';
import { PersonsPage } from './persons/PersonsPage.tsx';
import { PriceCalculatorPage } from './priceCalculator/PriceCalculatorPage.tsx';
import { SmsPage } from './sms/SmsPage.tsx';
import { UsersPage } from './users/UsersPage.tsx';


/**
 * The sidebar sections, in the order they appear in the menu.
 */
export const MODULE_GROUPS = [
	{ id: 'finance', label: 'Finanse' },
	{ id: 'records', label: 'Kartoteka' },
	{ id: 'communication', label: 'Komunikacja' },
	{ id: 'administration', label: 'Administracja' },
] as const;

export type ModuleGroupId = typeof MODULE_GROUPS[number]['id'];


export interface AppModule {
	id: string;
	/** As it appears in the sidebar, and as the page title in the top bar. */
	label: string;
	path: string;
	icon: LucideIcon;
	/** The sidebar section the module is listed under. */
	group: ModuleGroupId;
	/** Any one of these is enough to reach the module. An empty list means everybody. */
	permissions: readonly Permission[];
	/** The screen itself. Rendered inside the dashboard shell. */
	Component: ComponentType;
}


/**
 * Every module the application has, in the order they appear in the sidebar.
 * Modules of one group have to stay next to each other, so that the order here and the order on screen remain the same.
 */
export const MODULES: readonly AppModule[] = [
	{
		id: 'payment-lists',
		label: 'Listy płatności',
		path: paths.paymentLists,
		icon: ListChecks,
		group: 'finance',
		permissions: ['READ_LISTS'],
		Component: PaymentListsPage,
	},
	{
		id: 'deposits',
		label: 'Wpłaty',
		path: paths.deposits,
		icon: Wallet,
		group: 'finance',
		permissions: ['READ_PAYMENTS'],
		Component: DepositsPage,
	},
	{
		id: 'price-calculator',
		label: 'Kalkulator cen',
		path: paths.priceCalculator,
		icon: Calculator,
		group: 'finance',
		permissions: ['READ_GROUPS'],
		Component: PriceCalculatorPage,
	},
	{
		id: 'persons',
		label: 'Osoby',
		path: paths.persons,
		icon: UserRound,
		group: 'records',
		permissions: ['READ_PERSONS'],
		Component: PersonsPage,
	},
	{
		id: 'groups',
		label: 'Grupy',
		path: paths.groups,
		icon: UsersRound,
		group: 'records',
		permissions: ['READ_GROUPS'],
		Component: GroupsPage,
	},
	{
		id: 'instructors',
		label: 'Instruktorzy',
		path: paths.instructors,
		icon: GraduationCap,
		group: 'records',
		permissions: ['READ_INSTRUCTORS'],
		Component: InstructorsPage,
	},
	{
		id: 'sms',
		label: 'Wiadomości SMS',
		path: paths.sms,
		icon: MessageSquare,
		group: 'communication',
		permissions: ['READ_SMS'],
		Component: SmsPage,
	},
	{
		id: 'users',
		label: 'Zarządzanie użytkownikami',
		path: paths.users,
		icon: UserShield,
		group: 'administration',
		permissions: ['MANAGE_USERS'],
		Component: UsersPage,
	},
];
