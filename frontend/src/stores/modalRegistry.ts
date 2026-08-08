import type { ComponentType } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'custom';

export interface ModalDefinition<P> {
	load: () => Promise<{ default: ComponentType<P> }>;
	title: string;
	size?: ModalSize;
	/** False stops escape and the backdrop from closing it, and hides the close button. */
	dismissible?: boolean;
}

/**
 * Identity at runtime. It exists to pin each entry to {@link ModalDefinition} and capture the
 * component's props as `P` - which is what lets `openModal` demand the right props for a given key.
 */
function defineModal<P>(definition: ModalDefinition<P>): ModalDefinition<P> {
	return definition;
}

/**
 * Every modal the application can open, by key.
 *
 * A modal that needs input takes it as props:
 *
 *     'persons.edit': defineModal({
 *         load: () => import('@/modules/persons/modals/EditPersonModal.tsx'),
 *         title: 'Edytuj osobę',
 *     }),
 *
 *     openModal('persons.edit', { personId });
 */
export const MODAL_REGISTRY = {
	'auth.account': defineModal({
		load: () => import('@/modules/auth/modals/AccountModal.tsx'),
		title: 'Twoje konto',
		size: 'md',
	}),

	'users.create': defineModal({
		load: () => import('@/modules/users/modals/CreateUserModal.tsx'),
		title: 'Nowe konto',
		size: 'md',
	}),

	'users.edit': defineModal({
		load: () => import('@/modules/users/modals/EditUserModal.tsx'),
		title: 'Edytuj konto',
		size: 'md',
	}),
};


export type ModalKey = keyof typeof MODAL_REGISTRY;

/** The props of the component behind a key, which is what `openModal` demands at that key. */
export type ModalProps<K extends ModalKey> = (typeof MODAL_REGISTRY)[K] extends ModalDefinition<infer P> ? P : never;

/** Loaded on the way to being opened, never during.  */
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
 * Hang it off whatever the user touches before the modal itself: `onMouseEnter` on the trigger, and `onFocus` for anyone arriving by keyboard.
 */
export function preloadModal(key: ModalKey): void {
	void loadModal(key);
}

/**
 * The same, for the whole registry, once the page has gone quiet.
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
