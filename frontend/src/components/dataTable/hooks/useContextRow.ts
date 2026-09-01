import { useContextMenuStore } from '@/stores/menuStore';


/**
 * The row whose context menu is open, so it can stay marked while the menu hangs off it.
 */
export function useContextRow(): { contextRowId: string | null; setContextRowId: (rowId: string) => void } {
	const contextRowId = useContextMenuStore((state) => ( state.anchor === null ? null : state.owner ));
	const setContextRowId = useContextMenuStore((state) => state.claim);

	return { contextRowId, setContextRowId };
}
