import type { LucideIcon } from 'lucide-react';
import { contextMenu, type TriggerEvent } from 'react-contexify';
import { create } from 'zustand';

/** Identifies the one menu mounted at the root. */
export const CONTEXT_MENU_ID = 'app-context-menu';

/**
 * One option of a context menu.
 */
export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: LucideIcon;
	onSelect: () => void;
	disabled?: boolean;
	/** Drawn in the error color, through the `menu-item-destructive` class the theme defines. */
	danger?: boolean;
	/** Draws a divider above this item. */
	separatorBefore?: boolean;
}

interface ContextMenuState {
	items: ContextMenuItem[];
	/**
	 * Puts these items in the menu and opens it at the cursor.
	 * Suppresses the browser's own menu itself, so no caller has to remember to.
	 */
	open: (event: TriggerEvent, items: ContextMenuItem[]) => void;
	/** Drops the items, so their handlers cannot outlive the screen they were built on. */
	clear: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
	items: [],

	open: (event, items) => {
		event.preventDefault();

		set({ items });

		contextMenu.show({ id: CONTEXT_MENU_ID, event });
	},

	clear: () => set({ items: [] }),
}));

/**
 * Closes the menu.
 *
 * The items outlive the call by one closing animation: dropping them here would empty the menu while it is
 * still on screen shrinking away. `GlobalContextMenu` clears them once that animation is over.
 */
export function dismissContextMenu(): void {
	contextMenu.hideAll();
}

/**
 * `const openMenu = useContextMenu()` then `onContextMenu={ (event) => openMenu(event, items) }`.
 */
export function useContextMenu(): ContextMenuState['open'] {
	return useContextMenuStore((state) => state.open);
}
