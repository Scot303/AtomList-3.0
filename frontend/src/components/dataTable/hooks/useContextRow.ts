import { useState } from 'react';
import { useContextMenuStore } from '@/stores/menuStore';


/**
 * The row whose context menu is open, so it can stay marked while the menu hangs off it.
 */
export function useContextRow(): { contextRowId: string | null; setContextRowId: (rowId: string | null) => void } {
	const [rowId, setContextRowId] = useState<string | null>(null);

	const contextMenuOpen = useContextMenuStore((state) => state.anchor !== null);

	return { contextRowId: contextMenuOpen ? rowId : null, setContextRowId };
}
