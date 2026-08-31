import type React from 'react';
import { useEffect, useRef, useState } from 'react';


interface NavigableOption {
	id: string;
}


interface UseListboxNavigationConfig {
	/** Picks the active option. Wired to Enter. */
	onPick: (id: string) => void;
	/**
	 * Option to lead with instead of waiting for an arrow key.
	 * Set while a search is narrowing the list - it is what makes type-then-Enter work.
	 */
	leadOptionId?: string | null;
	/** Focuses the list itself, for when there is no search box to put focus within reach of the arrow keys. */
	focusList?: boolean;
}


/**
 * Roving highlight for a listbox: arrows to move, Home/End to jump, Enter to pick.
 * Escape is deliberately left alone - the panel's own dismissal handles it.
 */
export function useListboxNavigation(options: readonly NavigableOption[], config: UseListboxNavigationConfig) {
	const { onPick, leadOptionId = null, focusList = false } = config;

	const listRef = useRef<HTMLDivElement>(null);
	const [activeId, setActiveId] = useState<string | null>(null);

	const isShown = (id: string | null) => id !== null && options.some((option) => option.id === id);

	/**
	 * Derived rather than stored, so filtering can never leave the highlight on an option that is no longer shown.
	 * With nothing leading, nothing is active until an arrow key says so.
	 */
	const activeOptionId = isShown(activeId) ? activeId : isShown(leadOptionId) ? leadOptionId : null;

	// Keeps the highlight in view when it is moved by keyboard rather than by pointer.
	useEffect(() => {
		listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
	}, [activeOptionId]);

	useEffect(() => {
		if (focusList) {
			listRef.current?.focus({ preventScroll: true });
		}
	}, [focusList]);

	const moveActive = (delta: number) => {
		if (options.length === 0) {
			return;
		}

		const current = options.findIndex((option) => option.id === activeOptionId);

		const next =
			current === -1
				? delta > 0 ? 0 : options.length - 1
				: ( current + delta + options.length ) % options.length;

		setActiveId(options[next].id);
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				moveActive(1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				moveActive(-1);
				break;
			case 'Home':
				event.preventDefault();
				setActiveId(options[0]?.id ?? null);
				break;
			case 'End':
				event.preventDefault();
				setActiveId(options[options.length - 1]?.id ?? null);
				break;
			case 'Enter':
				if (activeOptionId !== null) {
					event.preventDefault();
					onPick(activeOptionId);
				}
				break;
		}
	};

	return { listRef, activeOptionId, setActiveId, handleKeyDown };
}
