import { useSyncExternalStore } from 'react';


/**
 * Tracks a media query.
 */
export function useMediaQuery(query: string): boolean {

	const subscribe = (onChange: () => void) => {
		const list = window.matchMedia(query);

		list.addEventListener('change', onChange);

		return () => list.removeEventListener('change', onChange);
	};

	const getSnapshot = () => window.matchMedia(query).matches;

	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}


/** Matches Tailwind's lg breakpoint, the point at which the sidebar stops being an overlay. */
export function useIsDesktop(): boolean {
	return useMediaQuery('(min-width: 1024px)');
}
