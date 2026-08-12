import type { LucideIcon } from 'lucide-react';
import { create } from 'zustand';


/**
 * One option of a context menu.
 */
export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: LucideIcon;
	onSelect: () => void;
	disabled?: boolean;
	/** Drawn in the error color. */
	danger?: boolean;
	/** Draws a divider above this item. */
	separatorBefore?: boolean;
}

/** The viewport point the menu hangs off - where the pointer was when it was summoned. */
export interface ContextMenuAnchor {
	x: number;
	y: number;
}

/** Whatever a `onContextMenu` handler was handed. */
export interface ContextMenuTrigger {
	clientX: number;
	clientY: number;
	preventDefault: () => void;
}

interface ContextMenuState {
	items: ContextMenuItem[];
	/** Null while the menu is closed. */
	anchor: ContextMenuAnchor | null;
	/** Whether the menu is closing without its animation, which is what picking something does. */
	instantClose: boolean;
	/** Puts these items in the menu and opens it at the cursor. */
	open: (event: ContextMenuTrigger, items: ContextMenuItem[]) => void;
	/** Closes the menu, leaving the items be so the closing animation still has something to draw. */
	close: (options?: { instant?: boolean }) => void;
	/** Drops the items, so their handlers cannot outlive the screen they were built on. */
	clear: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
	items: [],
	anchor: null,
	instantClose: false,

	open: (event, items) => {
		event.preventDefault();

		set({ items, anchor: { x: event.clientX, y: event.clientY }, instantClose: false });
	},

	close: (options) => set({ anchor: null, instantClose: options?.instant === true }),

	clear: () => set({ items: [] }),
}));

/**
 * Closes the menu.
 *
 * The items outlive the call by one closing animation: dropping them here would empty the menu while it is
 * still on screen shrinking away. `GlobalContextMenu` clears them once that animation is over.
 */
export function dismissContextMenu(): void {
	useContextMenuStore.getState().close();
}

/**
 * `const openMenu = useContextMenu()` then `onContextMenu={ (event) => openMenu(event, items) }`.
 */
export function useContextMenu(): ContextMenuState['open'] {
	return useContextMenuStore((state) => state.open);
}
