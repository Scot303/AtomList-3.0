import type { ComponentType } from 'react';


export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom';

/**
 * A fixed heading, or one built from the props the modal was opened with - for a modal titled after the record it is showing.
 *
 * Only for what the caller already knows. A title that arrives with a query belongs in `setModalTitle`.
 */
export type ModalTitle<P> = string | ( (props: NoInfer<P>) => string );


export interface ModalDefinition<P> {
	load: () => Promise<{ default: ComponentType<P> }>;
	title: ModalTitle<P>;
	size?: ModalSize;
	/** False stops escape and the backdrop from closing it, and hides the close button. */
	dismissible?: boolean;
}


/**
 * Identity at runtime.
 */
function defineModal<P>(definition: ModalDefinition<P>): ModalDefinition<P> {
	return definition;
}


/**
 * Every modal the application can open, by key.
 */
export const MODAL_REGISTRY = {
	'auth.account': defineModal({
		load: () => import('@/modules/auth/modals/AccountModal.tsx'),
		title: 'Twoje konto',
		size: 'md'
	}),

	'users.create': defineModal({
		load: () => import('@/modules/users/modals/CreateUserModal.tsx'),
		title: 'Nowy użytkownik',
		size: 'md',
	}),

	'users.edit': defineModal({
		load: () => import('@/modules/users/modals/EditUserModal.tsx'),
		title: 'Edytuj użytkownika',
		size: 'md',
	}),

	'persons.form': defineModal({
		load: () => import('@/modules/persons/modals/PersonFormModal.tsx'),
		title: ({ personId }) => ( personId === undefined ? 'Nowa osoba' : 'Szczegóły osoby' ),
		size: 'xl',
		dismissible: false
	}),

	'persons.groups': defineModal({
		load: () => import('@/modules/persons/modals/PersonGroupsModal.tsx'),
		title: ({ personName }) => `Grupy osoby - ${ personName }`,
		size: 'xl',
	}),

	'persons.families': defineModal({
		load: () => import('@/modules/persons/modals/FamiliesModal.tsx'),
		title: 'Rodziny',
		size: 'xl',
	}),

	'persons.discounts': defineModal({
		load: () => import('@/modules/persons/modals/PersonDiscountsModal.tsx'),
		title: ({ personName }) => `Zniżki osoby - ${ personName }`,
		size: 'xl',
	}),

	'groups.form': defineModal({
		load: () => import('@/modules/groups/modals/GroupFormModal.tsx'),
		title: ({ groupId, groupName }) => {
			if (groupId === undefined) {
				return 'Nowa grupa';
			}
			return groupName === undefined ? 'Szczegóły grupy' : `Szczegóły grupy - ${ groupName }`;
		},
		size: 'xl',
		dismissible: false
	}),

	'groups.members': defineModal({
		load: () => import('@/modules/groups/modals/GroupMembersModal.tsx'),
		title: ({ groupName }) => `Członkowie grupy - ${ groupName }`,
		size: 'lg',
	}),

	'payments.deposit': defineModal({
		load: () => import('@/modules/paymentLists/modals/DepositModal.tsx'),
		title: 'Wprowadź wpłatę',
		size: 'xl',
		dismissible: false
	}),

	'payments.settle': defineModal({
		load: () => import('@/modules/paymentLists/modals/SettlePaymentModal.tsx'),
		title: 'Rozlicz płatność',
		size: 'lg',
		dismissible: false
	}),

	'payments.details': defineModal({
		load: () => import('@/modules/paymentLists/modals/PaymentDetailsModal.tsx'),
		title: 'Szczegóły płatności',
		size: 'lg',
	}),

	'payments.oneOff': defineModal({
		load: () => import('@/modules/paymentLists/modals/OneOffPaymentModal.tsx'),
		title: ({ payment }) => ( payment === undefined ? 'Nowa opłata jednorazowa' : 'Edytuj opłatę jednorazową' ),
		size: 'md',
		dismissible: false
	}),

	'payments.quantity': defineModal({
		load: () => import('@/modules/paymentLists/modals/QuantityModal.tsx'),
		title: 'Zmień liczę wejść na zajęcia',
		size: 'md',
		dismissible: false
	}),

	'payments.edit': defineModal({
		load: () => import('@/modules/paymentLists/modals/PaymentEditModal.tsx'),
		title: 'Informacje dodatkowe',
		size: 'md',
		dismissible: false
	}),

	'lists.customForm': defineModal({
		load: () => import('@/modules/paymentLists/modals/CustomListFormModal.tsx'),
		title: ({ list }) => ( list === undefined ? 'Nowa lista' : 'Szczegóły listy' ),
		size: 'lg',
		dismissible: false
	}),

	'lists.addPersons': defineModal({
		load: () => import('@/modules/paymentLists/modals/AddPersonsModal.tsx'),
		title: 'Dodaj osoby do listy',
		size: 'md',
		dismissible: false
	}),

	'deposits.details': defineModal({
		load: () => import('@/modules/deposits/modals/DepositDetailsModal.tsx'),
		title: ({ depositCode }) => `Szczegóły wpłaty - (${ depositCode })`,
		size: 'lg',
	}),

	'deposits.allocate': defineModal({
		load: () => import('@/modules/deposits/modals/AllocateCreditModal.tsx'),
		title: ({ deposit }) => `Rozlicz nadpłatę - ${ deposit.code }`,
		size: 'xl',
		dismissible: false
	}),

	'deposits.find': defineModal({
		load: () => import('@/modules/deposits/modals/FindDepositModal.tsx'),
		title: 'Znajdź wpłatę',
		size: 'md',
		dismissible: false
	}),

	'deposits.personCredit': defineModal({
		load: () => import('@/modules/deposits/modals/PersonCreditModal.tsx'),
		title: ({ personName }) => `Wpłaty z wolnymi środkami osoby - ${ personName }`,
		size: 'lg',
	}),

	'lists.report': defineModal({
		load: () => import('@/modules/paymentLists/modals/ListReportModal.tsx'),
		title: 'Podsumowanie listy',
		size: 'lg',
	}),

	'lists.overpayments': defineModal({
		load: () => import('@/modules/paymentLists/modals/CreditSweepModal.tsx'),
		title: 'Rozlicz nadpłaty',
		size: 'lg',
		dismissible: false
	}),
};


export type ModalKey = keyof typeof MODAL_REGISTRY;

/** The props of the component behind a key, which is what `openModal` demands at that key. */
export type ModalProps<K extends ModalKey> = ( typeof MODAL_REGISTRY )[K] extends ModalDefinition<infer P> ? P : never;


export function resolveModalTitle(key: ModalKey, props: Record<string, unknown>): string {
	const { title } = MODAL_REGISTRY[key];

	return typeof title === 'function' ? ( title as (props: Record<string, unknown>) => string )(props) : title;
}


type LoadedModal = ComponentType<Record<string, unknown>>;


/** Components whose chunk has arrived, by key. */
export const loadedModals: Partial<Record<ModalKey, LoadedModal>> = {};


/** Resolves once the chunk is in memory. Repeat calls are free - the import is cached. */
export async function loadModal(key: ModalKey): Promise<void> {
	if (loadedModals[key] !== undefined) {
		return;
	}

	const module = await MODAL_REGISTRY[key].load();

	loadedModals[key] = module.default as LoadedModal;
}


/**
 * Fetches a modal's chunk ahead of time, so opening it is instant rather than a network round trip.
 */
export function preloadModal(key: ModalKey): void {
	void loadModal(key);
}


/**
 * Fetches the whole registry, once the page has gone quiet.
 * Worth making selective if the registry ever grows past a handful of heavy screens.
 */
export function preloadAllModals(): void {
	const preload = () => {
		for (const key of Object.keys(MODAL_REGISTRY) as ModalKey[]) {
			preloadModal(key);
		}
	};

	const idle: typeof window.requestIdleCallback | undefined = window.requestIdleCallback;

	if (idle) {
		idle(preload, { timeout: 5_000 });
	} else {
		window.setTimeout(preload, 2_000);
	}
}
