import { create } from 'zustand';
import { loadModal, type ModalKey, type ModalProps, type ModalSize } from '@/stores/modalRegistry.ts';


export interface ModalOptions {
	title?: string;
	size?: ModalSize;
	/** Merged onto the panel, so `max-w-3xl` here beats whatever the size preset set. */
	className?: string;
	/** False stops escape and the backdrop from closing it - for a modal holding unsaved input. */
	dismissible?: boolean;
}

interface OpenModal {
	key: ModalKey;
	props: Record<string, unknown>;
	options: ModalOptions;
}

/** Props stay optional at keys whose component does not require any. */
type OpenArgs<K extends ModalKey> = Record<string, never> extends ModalProps<K>
	? [props?: ModalProps<K>, options?: ModalOptions]
	: [props: ModalProps<K>, options?: ModalOptions];

interface ModalState {
	isOpen: boolean;
	/** Kept through the leave transition so the panel does not go blank on the way out. */
	current: OpenModal | null;
	/** Opens once the modal's code is in hand, so the panel never appears as a bare header with the body arriving a moment later. */
	openModal: <K extends ModalKey>(key: K, ...args: OpenArgs<K>) => Promise<void>;
	/** Lets an open modal retitle itself once it knows what it is showing. */
	setModalTitle: (title: string) => void;
	closeModal: () => void;
	resetModal: () => void;
}

/** Discards the result of an open that something else has already superseded. */
let openTicket = 0;

export const useModalStore = create<ModalState>((set, get) => ({
	isOpen: false,
	current: null,

	openModal: async (key, ...args) => {
		const [props, options] = args;
		const ticket = ++openTicket;

		await loadModal(key);

		if (ticket !== openTicket) {
			return;
		}

		set({
			isOpen: true,
			current: {
				key,
				props: (props ?? {}) as Record<string, unknown>,
				options: options ?? {},
			},
		});
	},

	setModalTitle: (title) => {
		const { current } = get();

		if (current === null) {
			return;
		}

		set({ current: { ...current, options: { ...current.options, title } } });
	},

	closeModal: () => set({ isOpen: false }),

	resetModal: () => {
		// Reopened before the leave transition finished: the new modal owns this slot now.
		if (get().isOpen) {
			return;
		}

		set({ current: null });
	},
}));
