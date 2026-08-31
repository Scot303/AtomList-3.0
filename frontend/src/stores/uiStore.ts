import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageKey } from '@/stores/storageKeys';

interface UiState {
	/** Whether the sidebar is pinned open on a wide screen. Remembered between visits. */
	sidebarOpen: boolean;
	/** The same menu as an overlay on a narrow screen. Deliberately never remembered. */
	mobileNavOpen: boolean;
	toggleSidebar: () => void;
	setMobileNavOpen: (open: boolean) => void;
}

const STORAGE_KEY = storageKey('ui');

export const useUiStore = create<UiState>()(
	persist(
		(set) => ({
			sidebarOpen: true,
			mobileNavOpen: false,

			toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
			setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
		}),
		{
			name: STORAGE_KEY,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
		},
	),
);
