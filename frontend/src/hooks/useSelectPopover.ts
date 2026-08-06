import { useCallback, useEffect, useRef, useState } from 'react';
import { autoUpdate, flip, offset, shift, size, useClick, useDismiss, useFloating, useInteractions, useTransitionStyles, } from '@floating-ui/react';

/** Distance between the trigger and the panel. */
const GAP = 6;

/** How close to the viewport edge the panel may sit before it is nudged back. */
const VIEWPORT_PADDING = 8;

/** The panel never grows past this, even with room to spare. */
const MAX_PANEL_HEIGHT = 320;

interface UseSelectPopoverOptions {
	onBlur?: () => void;
	/** `'trigger'` matches whatever opened the panel - right for a full-width form field. */
	width?: 'trigger' | string;
	/** Used instead of `width` while the add-new form is showing, which needs more room than a list. */
	addModeWidth?: string;
}

/**
 * Open state, dismissal, and positioning for a select panel that hangs off a trigger.
 */
export function useSelectPopover(options: UseSelectPopoverOptions = {}) {
	const { onBlur, width = 'trigger', addModeWidth } = options;

	const [open, setOpen] = useState(false);
	const [isAddMode, setIsAddMode] = useState(false);

	const targetWidth = isAddMode && addModeWidth !== undefined ? addModeWidth : width;

	const { refs, floatingStyles, context, placement } = useFloating({
		open,
		onOpenChange: setOpen,
		placement: 'bottom-start',

		// The trigger may sit inside a scrolling container; fixed keeps the panel with it.
		strategy: 'fixed',
		whileElementsMounted: autoUpdate,

		middleware: [
			offset(GAP),
			flip({ padding: VIEWPORT_PADDING }),
			shift({ padding: VIEWPORT_PADDING }),
			size({
				padding: VIEWPORT_PADDING,
				apply({ rects, elements, availableWidth, availableHeight }) {
					Object.assign(elements.floating.style, {
						width: targetWidth === 'trigger' ? `${ rects.reference.width }px` : targetWidth,
						maxWidth: `${ availableWidth }px`,
						maxHeight: `${ Math.min(MAX_PANEL_HEIGHT, availableHeight) }px`,
					});
				},
			}),
		],
	});

	const opensAbove = placement.startsWith('top');

	const { getReferenceProps, getFloatingProps } = useInteractions([
		useClick(context),
		useDismiss(context, { outsidePressEvent: 'mousedown' }),
	]);

	const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
		duration: { open: 200, close: 100 },
		initial: { opacity: 0, transform: opensAbove ? 'translateY(0.5rem)' : 'translateY(-0.5rem)' },
		open: { opacity: 1, transform: 'translateY(0)' },
	});

	/** Distinguishes "closed because it was open" from the closed state it started life in. */
	const hasOpened = useRef(false);

	useEffect(() => {
		if (open) {
			hasOpened.current = true;
			return;
		}

		if (!hasOpened.current) {
			return;
		}

		hasOpened.current = false;
		setIsAddMode(false);

		onBlur?.();

	}, [open, onBlur]);

	const close = useCallback(() => setOpen(false), []);

	return {
		open,
		opensAbove,
		isAddMode,
		setIsAddMode,
		isMounted,
		setReference: refs.setReference,
		setFloating: refs.setFloating,
		floatingStyles,
		transitionStyles,
		getReferenceProps,
		getFloatingProps,
		close,
	};
}

export type SelectPopoverState = ReturnType<typeof useSelectPopover>;
