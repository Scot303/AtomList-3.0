import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isCompleteColor } from '@/lib/color';
import { storageKey } from '@/stores/storageKeys';

/**
 * The colors this browser has picked lately.
 */

/** How many are remembered. The oldest falls off the end, and the strip that shows them is this wide. */
export const MAX_RECENT_COLORS = 10;

const STORAGE_KEY = storageKey('recent-colors');
const STORAGE_VERSION = 1;


interface RecentColorsState {
	/** Most recently used first. Six upper-case hex digits, no leading `#`. */
	colors: string[];
	/** Puts a color at the front, moving it there if it is already remembered. Ignores a half-typed one. */
	remember: (color: string) => void;
}

export const useRecentColorsStore = create<RecentColorsState>()(
	persist(
		(set) => ({
			colors: [],

			remember: (color) =>
				set((state) => {
					if (!isCompleteColor(color)) {
						return state;
					}

					const normalised = color.toUpperCase();

					// Already the most recent one, so there is nothing to reorder.
					if (state.colors[0] === normalised) {
						return state;
					}

					return {
						colors: [normalised, ...state.colors.filter((candidate) => candidate !== normalised)].slice(0, MAX_RECENT_COLORS),
					};
				}),
		}),
		{
			name: STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			version: STORAGE_VERSION,
			migrate: () => ({ colors: [] }) as Partial<RecentColorsState>,
		},
	),
);
