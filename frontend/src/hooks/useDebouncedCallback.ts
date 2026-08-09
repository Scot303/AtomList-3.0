import { useCallback, useEffect, useRef } from 'react';

/**
 * Defers a call until the caller stops making it for `delay` ms.
 *
 * For work that should follow typing rather than keep pace with it - re-filtering a few thousand
 * rows on every keystroke is the usual reason to reach for this.
 */
export function useDebouncedCallback<A extends unknown[]>(callback: (...args: A) => void, delay: number) {
	const latest = useRef(callback);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		latest.current = callback;
	});

	useEffect(() => () => {
		if (timer.current !== null) {
			clearTimeout(timer.current);
		}
	}, []);

	const cancel = useCallback(() => {
		if (timer.current !== null) {
			clearTimeout(timer.current);
			timer.current = null;
		}
	}, []);

	const run = useCallback((...args: A) => {
		if (timer.current !== null) {
			clearTimeout(timer.current);
		}

		timer.current = setTimeout(() => {
			timer.current = null;
			latest.current(...args);
		}, delay);
	}, [delay]);

	/** Runs immediately, dropping anything still pending. For a commit that must not wait. */
	const flush = useCallback((...args: A) => {
		cancel();
		latest.current(...args);
	}, [cancel]);

	return { run, flush, cancel };
}
