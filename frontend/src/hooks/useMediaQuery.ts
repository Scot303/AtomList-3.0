import { useCallback, useSyncExternalStore } from 'react'

/**
 * Tracks a media query.
 */
export function useMediaQuery(query: string): boolean {
	// Stable per query, or React would tear down and re-add the listener on every render.
	const subscribe = useCallback(
		(onChange: () => void) => {
			const list = window.matchMedia(query)

			list.addEventListener('change', onChange)

			return () => list.removeEventListener('change', onChange)
		},
		[query],
	)

	const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

	return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Matches Tailwind's lg breakpoint, the point at which the sidebar stops being an overlay. */
export function useIsDesktop(): boolean {
	return useMediaQuery('(min-width: 1024px)')
}
