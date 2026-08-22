import { functionalUpdate, type OnChangeFn, type Updater } from '@tanstack/react-table';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { TablePrefs } from '@/stores/tablePrefsStore';
import { selectTablePrefs, tablePrefsScope, useTablePrefsStore } from '@/stores/tablePrefsStore';


/** A slice of {@link TablePrefs} with its `undefined` filled in by the caller's fallback. */
type Slice<K extends keyof TablePrefs> = NonNullable<TablePrefs[K]>;


export interface TablePrefsBinding {
	/** Everything stored for this table and user. Slices that were never touched are absent. */
	prefs: TablePrefs;
	/** Reads a slice, falling back when nothing is stored. */
	read: <K extends keyof TablePrefs>(key: K, fallback: Slice<K>) => Slice<K>;
	/** An `OnChangeFn` for a slice, so it can be handed straight to a TanStack `on*Change` option. */
	bind: <K extends keyof TablePrefs>(key: K, current: Slice<K>) => OnChangeFn<Slice<K>>;
	/** Forgets this table's layout entirely. */
	reset: () => void;
}


/**
 * Binds one table's stored preferences to the signed-in user.
 */
export function useTablePrefs(moduleKey: string): TablePrefsBinding {
	const { user } = useAuth();
	const userId = user?.id;

	const scope = tablePrefsScope(userId, moduleKey);

	const prefs = useTablePrefsStore(selectTablePrefs(scope));
	const patch = useTablePrefsStore((state) => state.patch);
	const resetScope = useTablePrefsStore((state) => state.reset);

	const read = <K extends keyof TablePrefs>(key: K, fallback: Slice<K>): Slice<K> =>
		( prefs[key] as Slice<K> | undefined ) ?? fallback;

	const bind = <K extends keyof TablePrefs>(key: K, current: Slice<K>): OnChangeFn<Slice<K>> =>
		(updater: Updater<Slice<K>>) => patch(scope, { [key]: functionalUpdate(updater, current) });

	const reset = () => resetScope(scope);

	return { prefs, read, bind, reset };
}

