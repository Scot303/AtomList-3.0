import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * Closes an overlay when the route changes.
 */
export function useCloseOnNavigate(close: () => void) {
	const { pathname } = useLocation();
	const previous = useRef(pathname);

	useEffect(() => {
		if (previous.current === pathname) {
			return;
		}

		previous.current = pathname;
		close();
	}, [close, pathname]);
}
