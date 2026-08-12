import { type RefObject, useEffect } from 'react';


/** Keys that scroll whatever is under the pointer or focus. Arrows included, since a menu consumes its own. */
const SCROLL_KEYS = new Set([
	'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar',
	'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);


/**
 * Holds the page still while something is anchored to a point on it.
 *
 * @param active      whether to hold. Listeners are attached only while this is true.
 * @param allowWithin an element whose own scrolling should still work - the anchored surface itself.
 */
export function useScrollLock(active: boolean, allowWithin?: RefObject<HTMLElement | null>): void {
	useEffect(() => {
		if (!active) {
			return;
		}

		const isExempt = (target: EventTarget | null) =>
			target instanceof Node && (allowWithin?.current?.contains(target) ?? false);

		const blockGesture = (event: WheelEvent | TouchEvent) => {
			if (!isExempt(event.target)) {
				event.preventDefault();
			}
		};

		const blockKey = (event: KeyboardEvent) => {
			if (SCROLL_KEYS.has(event.key) && !isExempt(event.target)) {
				event.preventDefault();
			}
		};

		// Capturing and non-passive: the browser only honors preventDefault on a wheel listener that opted out of passive.
		const options: AddEventListenerOptions = { capture: true, passive: false };

		window.addEventListener('wheel', blockGesture, options);
		window.addEventListener('touchmove', blockGesture, options);
		window.addEventListener('keydown', blockKey, options);

		return () => {
			window.removeEventListener('wheel', blockGesture, options);
			window.removeEventListener('touchmove', blockGesture, options);
			window.removeEventListener('keydown', blockKey, options);
		};
	}, [active, allowWithin]);
}
