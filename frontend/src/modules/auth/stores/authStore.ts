import { create } from 'zustand'

interface AuthState {
	/**
	 * The access token, held in memory only.
	 */
	accessToken: string | null;
	setAccessToken: (token: string | null) => void;
	clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
	accessToken: null,

	setAccessToken: (accessToken) => set({ accessToken }),
	clear: () => set({ accessToken: null }),
}));
