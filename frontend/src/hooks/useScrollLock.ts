import { type RefObject, useEffect } from 'react';


/** Keys that scroll whatever is under the pointer or focus. Arrows included, since a menu consumes its own. */
const SCROLL_KEYS = new Set([
	'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar',
	'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);


/** The overflow values that make an element a box the user can scroll. */
const SCROLLABLE = new Set(['auto', 'scroll']);


/**
 * Whether `element` has room left on the axis the gesture is on, and so would move rather than pass it on.
 */
function absorbs(element: HTMLElement, deltaX: number, deltaY: number): boolean {
	const style = getComputedStyle(element);

	// The `- 1` is for rounding: a box scrolled to its end can measure a fraction of a pixel short of it.
	const hasRoom = (delta: number, offset: number, extent: number, visible: number) =>
		delta !== 0 && ( delta < 0 ? offset > 0 : offset + visible < extent - 1 );

	return ( SCROLLABLE.has(style.overflowY) && hasRoom(deltaY, element.scrollTop, element.scrollHeight, element.clientHeight) )
		|| ( SCROLLABLE.has(style.overflowX) && hasRoom(deltaX, element.scrollLeft, element.scrollWidth, element.clientWidth) );
}


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
			target instanceof Node && ( allowWithin?.current?.contains(target) ?? false );

		/**
		 * A surface scrolled to its end - or one whose content fits, so it never scrolls at all - hands the gesture to
		 * whatever is behind it, and that is the scrolling this hook exists to stop.
		 */
		const isAbsorbed = (event: WheelEvent) => {
			const surface = allowWithin?.current ?? null;
			const target = event.target;

			if (surface === null || !( target instanceof Node ) || !surface.contains(target)) {
				return false;
			}

			for (let node: Node | null = target; node !== null; node = node.parentNode) {
				if (node instanceof HTMLElement && absorbs(node, event.deltaX, event.deltaY)) {
					return true;
				}

				if (node === surface) {
					return false;
				}
			}

			return false;
		};

		const blockWheel = (event: WheelEvent) => {
			if (!isAbsorbed(event)) {
				event.preventDefault();
			}
		};

		const blockTouch = (event: TouchEvent) => {
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

		window.addEventListener('wheel', blockWheel, options);
		window.addEventListener('touchmove', blockTouch, options);
		window.addEventListener('keydown', blockKey, options);

		return () => {
			window.removeEventListener('wheel', blockWheel, options);
			window.removeEventListener('touchmove', blockTouch, options);
			window.removeEventListener('keydown', blockKey, options);
		};
	}, [active, allowWithin]);
}
