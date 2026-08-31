import { useEffect, useRef, useState } from 'react';
import { autoUpdate, type DetectOverflowOptions, flip, hide, offset, shift, type SideObject, size, useClick, useDismiss, useFloating, useInteractions, useTransitionStyles, } from '@floating-ui/react';
import { useScrollLock } from '@/hooks/useScrollLock';
import { resolvePopoverAnchor } from '@/lib/popoverAnchor';
import { usePopoverClip } from './usePopoverClip';


/** Distance between the trigger and the panel. */
const GAP = 6;

/** How close to an edge the panel may sit before it is nudged back. */
const VIEWPORT_PADDING = 8;

/** The default a list panel never grows past, even with room to spare. */
const MAX_PANEL_HEIGHT = 320;

/**
 * What a panel is allowed to shrink to before staying inside its container stops being worth it.
 */
const MIN_PANEL_HEIGHT = 180;
const MIN_PANEL_WIDTH = 200;


interface UsePopoverOptions {
	onBlur?: () => void;
	/** Told when the panel opens and when it closes - a table cell uses it to mark itself as edited. */
	onOpenChange?: (open: boolean) => void;
	/** `'trigger'` matches whatever opened the panel - right for a full-width form field. */
	width?: 'trigger' | string;
	expandedWidth?: string;
	/** Raises the cap for a panel that is more than a list. */
	maxHeight?: number;
	/** Which edge of the anchor the panel lines up with. */
	align?: 'start' | 'end';
	/** Whether a press outside the panel dismisses it. */
	outsidePress?: (event: MouseEvent) => boolean;
	/** Holds the page still while the panel is open. */
	lockScroll?: boolean;
}


/**
 * Open state, dismissal, and positioning for a panel that hangs off a trigger.
 */
export function usePopover(options: UsePopoverOptions = {}) {
	const { onBlur, onOpenChange, width = 'trigger', expandedWidth, maxHeight = MAX_PANEL_HEIGHT, align = 'start', outsidePress, lockScroll = false } = options;

	const [open, setOpen] = useState(false);
	const [isExpanded, setExpanded] = useState(false);

	const targetWidth = isExpanded && expandedWidth !== undefined ? expandedWidth : width;
	const targetWidthRef = useRef(targetWidth);


	/** Supplied by whichever scrolling container the trigger sits in, and a no-op outside one. */
	const clip = usePopoverClip();

	const placementClip = () => {
		const { boundary, padding } = clip();

		return { boundary, padding: insetBy(padding, VIEWPORT_PADDING) };
	};


	const { refs, floatingStyles, context, placement, middlewareData, update } = useFloating({
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
			size(() => ( {
				...placementClip(),
				apply({ rects, elements, availableWidth, availableHeight }) {
					Object.assign(elements.floating.style, {
						width: targetWidthRef.current === 'trigger' ? `${ rects.reference.width }px` : targetWidthRef.current,
						maxWidth: `${ Math.max(availableWidth, MIN_PANEL_WIDTH) }px`,
						maxHeight: `${ Math.min(maxHeight, Math.max(availableHeight, MIN_PANEL_HEIGHT)) }px`,
					});
				},
			} )),

			hide(clip),
		],
	});


	const { floating: floatingRef } = refs;

	/* The panel keeps its own scrolling; the page under it stays put, so the trigger cannot drift away. */
	useScrollLock(lockScroll && open, floatingRef);


	useEffect(() => {
		targetWidthRef.current = targetWidth;
		update();
	}, [targetWidth, update]);


	const opensAbove = placement.startsWith('top');

	/** The trigger has scrolled out of the container it lives in, or under whatever floats over that container's leading edge. */
	const isTriggerHidden = middlewareData.hide?.referenceHidden === true;

	const { getReferenceProps, getFloatingProps } = useInteractions([
		useClick(context),
		useDismiss(context, { outsidePressEvent: 'mousedown', outsidePress: outsidePress ?? true }),
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

		setExpanded(false);

		onBlur?.();

	}, [open, onBlur]);

	const close = () => setOpen(false);


	const setReference = (node: Element | null) => {
		refs.setReference(node);
		refs.setPositionReference(node && resolvePopoverAnchor(node));
	};

	return {
		open,
		/** For opening the panel without a click - a cell that mounts straight into edit mode. */
		setOpen,
		opensAbove,
		maxHeight,
		setExpanded,
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


export type PopoverState = ReturnType<typeof usePopover>;


/**
 * A clip's padding widened by `extra` on every side.
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
