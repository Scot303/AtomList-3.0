import { useEffect, useRef, useState } from 'react';


/** Below this, a reported change is sub-pixel noise rather than a resize - and reacting to it risks a feedback loop. */
const EPSILON = 0.5;


/**
 * The height of an element's content, re-measured whenever it changes.
 */
export function useContentHeight<T extends HTMLElement>() {
	const ref = useRef<T>(null);
	const [height, setHeight] = useState<number>();

	useEffect(() => {
		const element = ref.current;

		if (element === null) {
			return;
		}

		const observer = new ResizeObserver(([entry]) => {
			const next = entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height;

			setHeight((current) => ( current !== undefined && Math.abs(current - next) < EPSILON ? current : next ));
		});

		observer.observe(element);

		return () => observer.disconnect();
	}, []);

	return { ref, height };
}
