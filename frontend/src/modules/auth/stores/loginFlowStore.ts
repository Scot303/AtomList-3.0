import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageKey } from '@/stores/storageKeys';

export type LoginStep = 'identifier' | 'code';

interface LoginFlowState {
	step: LoginStep;
	/** What the user typed - carried into step two so the code can be verified against it. */
	identifier: string;
	/** When the last code was asked for, so the resend countdown survives a reload. */
	codeRequestedAt: number | null;
	beginCodeStep: (identifier: string) => void;
	markCodeRequested: () => void;
	reset: () => void;
}

const STORAGE_KEY = storageKey('login-flow');

/**
 * The half-finished sign-in, kept across a reload so refreshing the page mid-flow does not throw
 * away a code that is already sitting in the user's inbox.
 *
 * sessionStorage rather than localStorage: this is per-tab and dies when the tab does.
 */
export const useLoginFlowStore = create<LoginFlowState>()(
	persist(
		(set) => ({
			step: 'identifier',
			identifier: '',
			codeRequestedAt: null,

			beginCodeStep: (identifier) => set({ step: 'code', identifier, codeRequestedAt: Date.now() }),
			markCodeRequested: () => set({ codeRequestedAt: Date.now() }),
			reset: () => set({ step: 'identifier', identifier: '', codeRequestedAt: null }),
		}),
		{
			name: STORAGE_KEY,
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);
