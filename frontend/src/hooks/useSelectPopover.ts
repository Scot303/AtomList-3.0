import { useCallback, useEffect, useRef, useState } from 'react';
import { autoUpdate, type DetectOverflowOptions, flip, hide, offset, shift, type SideObject, size, useClick, useDismiss, useFloating, useInteractions, useTransitionStyles, } from '@floating-ui/react';
import { resolvePopoverAnchor } from '@/lib/popoverAnchor';
import { usePopoverClip } from './usePopoverClip';

/** Distance between the trigger and the panel. */
const GAP = 6;

/** How close to an edge the panel may sit before it is nudged back. */
const VIEWPORT_PADDING = 8;

/** The default a list panel never grows past, even with room to spare. */
export const MAX_PANEL_HEIGHT = 320;

/**
 * What a panel is allowed to shrink to before staying inside its container stops being worth it.
 */
const MIN_PANEL_HEIGHT = 180;
const MIN_PANEL_WIDTH = 200;

interface UseSelectPopoverOptions {
	onBlur?: () => void;
	/** Told when the panel opens and when it closes - a table cell uses it to mark itself as edited. */
	onOpenChange?: (open: boolean) => void;
	/** `'trigger'` matches whatever opened the panel - right for a full-width form field. */
	width?: 'trigger' | string;
	/** Used instead of `width` while the add-new form is showing, which needs more room than a list. */
	addModeWidth?: string;
	/** Raises the cap for a panel that is more than a list. */
	maxHeight?: number;
	/**
	 * Which edge of the anchor the panel lines up with.
	 * Only worth setting for a panel narrower than the field it belongs to.
	 */
	align?: 'start' | 'end';
}

/**
 * Open state, dismissal, and positioning for a select panel that hangs off a trigger.
 */
export function useSelectPopover(options: UseSelectPopoverOptions = {}) {
	const { onBlur, onOpenChange, width = 'trigger', addModeWidth, maxHeight = MAX_PANEL_HEIGHT, align = 'start' } = options;

	const [open, setOpen] = useState(false);
	const [isAddMode, setIsAddMode] = useState(false);

	const targetWidth = isAddMode && addModeWidth !== undefined ? addModeWidth : width;

	/** Supplied by whichever scrolling container the trigger sits in, and a no-op outside one. */
	const clip = usePopoverClip();

	/** The same clip, for the middleware that places the panel rather than the one that hides it. */
	const placementClip = useCallback(() => {
		const { boundary, padding } = clip();

		return { boundary, padding: insetBy(padding, VIEWPORT_PADDING) };
	}, [clip]);

	const { refs, floatingStyles, context, placement, middlewareData } = useFloating({
		open,
		onOpenChange: setOpen,
		placement: `bottom-${ align }`,

		// The trigger may sit inside a scrolling container; fixed keeps the panel with it.
		strategy: 'fixed',
		whileElementsMounted: autoUpdate,

		middleware: [
			offset(GAP),
			flip(placementClip),
			shift(placementClip),
			size(() => ({
				...placementClip(),
				apply({ rects, elements, availableWidth, availableHeight }) {
					Object.assign(elements.floating.style, {
						width: targetWidth === 'trigger' ? `${ rects.reference.width }px` : targetWidth,
						maxWidth: `${ Math.max(availableWidth, MIN_PANEL_WIDTH) }px`,
						maxHeight: `${ Math.min(maxHeight, Math.max(availableHeight, MIN_PANEL_HEIGHT)) }px`,
					});
				},
			})),

			hide(clip),
		],
	});

	const opensAbove = placement.startsWith('top');

	/** The trigger has scrolled out of the container it lives in, or under whatever floats over that container's leading edge. */
	const isTriggerHidden = middlewareData.hide?.referenceHidden === true;

	const { getReferenceProps, getFloatingProps } = useInteractions([
		useClick(context),
		useDismiss(context, { outsidePressEvent: 'mousedown' }),
	]);

	const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
		duration: { open: 200, close: 100 },
		initial: { opacity: 0, transform: opensAbove ? 'translateY(0.5rem)' : 'translateY(-0.5rem)' },
		open: { opacity: 1, transform: 'translateY(0)' },
	});

	/**
	 * What the caller was last told the panel was doing.
	 */
	const reportedOpen = useRef(open);

	useEffect(() => {
		if (reportedOpen.current === open) {
			return;
		}

		reportedOpen.current = open;
		onOpenChange?.(open);
	}, [open, onOpenChange]);

	/**
	 * Distinguishes "closed because it was open" from the closed state it started life in.
	 */
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

	/**
	 * The trigger and the box the panel is measured against.
	 *
	 * Two references rather than one because they answer different questions.
	 * Clicks and outside presses belong to the trigger, so that stays the reference proper.
	 * Placement belongs to whatever box the trigger was dropped into.
	 *
	 * Done here rather than at each call site, so a popover cannot be written without it.
	 */
	const setReference = useCallback((node: Element | null) => {
		refs.setReference(node);
		refs.setPositionReference(node && resolvePopoverAnchor(node));
	}, [refs]);

	return {
		open,
		/** For opening the panel without a click - a cell that mounts straight into edit mode. */
		setOpen,
		opensAbove,
		maxHeight,
		isAddMode,
		setIsAddMode,
		isMounted,
		isTriggerHidden,
		setReference,
		setFloating: refs.setFloating,
		floatingStyles,
		transitionStyles,
		getReferenceProps,
		getFloatingProps,
		close,
	};
}

export type SelectPopoverState = ReturnType<typeof useSelectPopover>;

/**
 * A clip's padding widened by `extra` on every side.
 *
 * Spelled out per side rather than handed to floating-ui as two separate paddings because there is
 * only one slot for it: a container's inset says what floats over its leading edge, and the panel's
 * own inset says how close to any edge it may sit. Both apply at once, so they add.
 */
function insetBy(padding: DetectOverflowOptions['padding'], extra: number): SideObject {
	const sides = typeof padding === 'number'
		? { top: padding, right: padding, bottom: padding, left: padding }
		: { top: 0, right: 0, bottom: 0, left: 0, ...padding };

	return {
		top: sides.top + extra,
		right: sides.right + extra,
		bottom: sides.bottom + extra,
		left: sides.left + extra,
	};
}
