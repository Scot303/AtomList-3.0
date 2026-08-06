import { create } from 'zustand';

export type DialogVariant = 'danger' | 'warning' | 'info';

export interface DialogOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: DialogVariant;
	/** Drop the cancel button for dialogs that only need acknowledging. */
	showCancel?: boolean;
	onConfirm?: () => void | Promise<void>;
}

interface DialogState {
	isOpen: boolean;
	/** True while `onConfirm` is in flight. Blocks a second confirm, escape, and the backdrop. */
	isConfirming: boolean;
	title: string;
	message: string;
	confirmText: string;
	cancelText: string;
	variant: DialogVariant;
	showCancel: boolean;
	onConfirm?: () => void | Promise<void>;
	/** Settles the promise handed back by `openDialog`. */
	resolve?: (confirmed: boolean) => void;
	/** Resolves true once the action succeeded, false if the user backed out. */
	openDialog: (options: DialogOptions) => Promise<boolean>;
	confirmDialog: () => Promise<void>;
	closeDialog: () => void;
	/** Drops the last dialog's text and callback once it has finished animating out. */
	resetDialog: () => void;
}

const BLANK = {
	title: '',
	message: '',
	confirmText: 'OK',
	cancelText: 'Anuluj',
	variant: 'info' as DialogVariant,
	showCancel: true,
	onConfirm: undefined,
	resolve: undefined,
};

export const useDialogStore = create<DialogState>((set, get) => ({
	isOpen: false,
	isConfirming: false,
	...BLANK,

	openDialog: (options) =>
		new Promise<boolean>((resolve) => {
			// A dialog raised over another one would otherwise leave the first caller awaiting forever.
			get().resolve?.(false);

			set({
				isOpen: true,
				isConfirming: false,
				title: options.title,
				message: options.message,
				confirmText: options.confirmText ?? 'OK',
				cancelText: options.cancelText ?? 'Anuluj',
				variant: options.variant ?? 'info',
				showCancel: options.showCancel ?? true,
				onConfirm: options.onConfirm,
				resolve,
			});
		}),

	confirmDialog: async () => {
		const { isConfirming, onConfirm, resolve } = get();

		if (isConfirming) {
			return;
		}

		if (onConfirm) {
			set({ isConfirming: true });

			try {
				await onConfirm();
			} catch {
				set({ isConfirming: false });
				return;
			}
		}

		set({ isOpen: false, isConfirming: false, resolve: undefined });
		resolve?.(true);
	},

	closeDialog: () => {
		const { isOpen, isConfirming, resolve } = get();

		// Escape and the backdrop must not walk away from an action that is already running.
		if (!isOpen || isConfirming) {
			return;
		}

		set({ isOpen: false, resolve: undefined });
		resolve?.(false);
	},

	resetDialog: () => {
		if (get().isOpen) {
			return;
		}

		set(BLANK);
	},
}));

/**
 * `const confirm = useConfirm()` then `if (await confirm({ ... })) { ... }`.
 * Pass `onConfirm` when the work should run inside the dialog with a loading state.
 * await the result instead when the dialog should close first and the caller carries on.
 */
export function useConfirm() {
	return useDialogStore((state) => state.openDialog);
}
