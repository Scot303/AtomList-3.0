import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageKey } from '@/stores/storageKeys';
import type { FilterActiveTag, SortTag } from '@/components/dataTable/types/filterTypes';

/**
 * How a user has arranged one table: which columns, in what order, at what width,
 * how filtered, and sorted - remembered between visits.
 *
 * Every field is optional: a table that has never been touched stores nothing,
 * and a table whose features are off never writes the slices it does not use.
 */
export interface TablePrefs {
	columnOrder?: string[];
	columnVisibility?: Record<string, boolean>;
	columnSizing?: Record<string, number>;
	filterTags?: FilterActiveTag[];
	sortTags?: SortTag[];
	showFilters?: boolean;
	grouping?: string[];
}

/**
 * Scopes preferences to a user as well as a table.
 */
export type TablePrefsScope = string & { readonly __brand: 'TablePrefsScope' };

export function tablePrefsScope(userId: string | undefined, moduleKey: string): TablePrefsScope {
	return `${ userId ?? 'anonymous' }::${ moduleKey }` as TablePrefsScope;
}


interface TablePrefsState {
	byScope: Record<string, TablePrefs>;
	/** Merges a patch into one table's preferences. */
	patch: (scope: TablePrefsScope, patch: Partial<TablePrefs>) => void;
	/** Forgets one table's layout, returning it to the column definitions' defaults. */
	reset: (scope: TablePrefsScope) => void;
	/** Forgets every table for one user. */
	clearUser: (userId: string) => void;
}

const STORAGE_KEY = storageKey('table-prefs');
const STORAGE_VERSION = 1;

const EMPTY_PREFS: TablePrefs = {};


export const useTablePrefsStore = create<TablePrefsState>()(
	persist(
		(set) => ({
			byScope: {},

			patch: (scope, patch) =>
				set((state) => ({
					byScope: {
						...state.byScope,
						[scope]: { ...state.byScope[scope], ...patch },
					},
				})),

			reset: (scope) =>
				set((state) => {
					if (!(scope in state.byScope)) {
						return state;
					}

					const byScope = { ...state.byScope };
					delete byScope[scope];

					return { byScope };
				}),

			clearUser: (userId) =>
				set((state) => {
					const prefix = `${ userId }::`;
					const byScope = Object.fromEntries(
						Object.entries(state.byScope).filter(([scope]) => !scope.startsWith(prefix)),
					);

					return { byScope };
				}),
		}),
		{
			name: STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			version: STORAGE_VERSION,
			migrate: () => ({ byScope: {} }) as Partial<TablePrefsState>,
		},
	),
);

/** Reads one table's stored preferences. Returns a stable empty object when there are none. */
export function selectTablePrefs(scope: TablePrefsScope) {
	return (state: TablePrefsState): TablePrefs => state.byScope[scope] ?? EMPTY_PREFS;
}
