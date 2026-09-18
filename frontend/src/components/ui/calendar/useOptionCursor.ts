import { type RefObject, useEffect, useRef, useState } from 'react';
import { moveIndex } from './calendarOptions';


/**
 * @param listRef the scrolling box the rows live in.
 * @param count   how many rows the list has.
 * @param openAt  the row the cursor starts on.
 * @param onMove  told where the cursor went, so a scrolling list can bring the row into view.
 */
export function useOptionCursor(listRef: RefObject<HTMLDivElement | null>, count: number, openAt: number, onMove?: (index: number) => void) {
	const [activeIndex, setActiveIndex] = useState(openAt);
	const chasingFocus = useRef(false);

	/*
	 * Runs after every render, since a virtualised list may not have drawn the row the cursor moved to by the time the
	 * move itself is rendered - focus then catches up on the render that does draw it.
	 */
	useEffect(() => {
		if (!chasingFocus.current) {
			return;
		}

		const row = listRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');

		if (!row) {
			return;
		}

		chasingFocus.current = false;
		row.focus();
	});

	const handleKeyDown = (event: React.KeyboardEvent) => {
		const next = moveIndex(event.key, activeIndex, count);

		if (next === null) {
			return;
		}

		event.preventDefault();

		chasingFocus.current = true;
		setActiveIndex(next);
		onMove?.(next);
	};

	return { activeIndex, setActiveIndex, handleKeyDown };
}
