import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { Placement } from '@floating-ui/react';
import { autoUpdate, flip, FloatingFocusManager, FloatingPortal, shift, useDismiss, useFloating, useInteractions, useListNavigation, useRole, useTransitionStyles, } from '@floating-ui/react';
import { useCloseOnNavigate } from '@/hooks/useCloseOnNavigate';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cn } from '@/lib/cn';
import { type ContextMenuItem, dismissContextMenu, useContextMenuStore } from '@/stores/menuStore.ts';


/** The body-level container the menu is portalled into. */
const MENU_ROOT_ID = 'app-context-menu-root';

/** Above the modal layer, so a menu opened inside a dialog is not buried by it. */
const MENU_Z_INDEX = 2000;

/** How close to the viewport edge the menu may sit before it is nudged back. */
const VIEWPORT_PADDING = 8;

/** Where the menu goes when it does not fit below and to the right of the cursor, in the order it is tried. */
const FALLBACK_PLACEMENTS: Placement[] = ['bottom-end', 'top-start', 'top-end'];

/** The pop the menu opens and closes with, as react-contexify drew it: 0.3s, from a third of its size. */
const ANIMATION_MS = 250;
const ANIMATION_SCALE = 0.3;


/**
 * The corner of the menu that ended up under the cursor, which is the corner it should grow out of.
 */
function cursorCorner(placement: Placement): string {
	const [side, alignment] = placement.split('-');

	const vertical = side === 'top' ? 'bottom' : 'top';
	const horizontal = alignment === 'end' ? 'right' : 'left';

	return `${ vertical } ${ horizontal }`;
}


/**
 * The one context menu on the page. Mounted once, near the root; everything else fills it through `useContextMenu()(event, items)`.
 */
export const GlobalContextMenu = () => {
	const items = useContextMenuStore((state) => state.items);
	const anchor = useContextMenuStore((state) => state.anchor);
	const instantClose = useContextMenuStore((state) => state.instantClose);

	const close = useContextMenuStore((state) => state.close);
	const clear = useContextMenuStore((state) => state.clear);

	const open = anchor !== null;

	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

	useCloseOnNavigate(dismissContextMenu);


	const { refs, floatingStyles, context } = useFloating({
		open,
		onOpenChange: (nextOpen) => {
			if (!nextOpen) {
				dismissContextMenu();
			}
		},

		// The cursor is the top-left corner the menu grows from, until an edge of the screen says otherwise.
		placement: 'bottom-start',

		// The right-clicked row may sit inside a scrolling container; fixed keeps the menu where the cursor was.
		strategy: 'fixed',
		whileElementsMounted: autoUpdate,

		middleware: [
			// Turning the menu around near an edge, rather than only sliding it, keeps the cursor on one of its corners.
			flip({ fallbackPlacements: FALLBACK_PLACEMENTS, padding: VIEWPORT_PADDING }),
			shift({ padding: VIEWPORT_PADDING }),
		],
	});

	const { setFloating, setPositionReference, floating: floatingRef } = refs;

	/* The menu is pinned to where the cursor was. */
	useScrollLock(open, floatingRef);

	/**
	 * The menu hangs off the cursor, so the reference is a zero-sized point rather than an element.
	 */
	useEffect(() => {
		if (anchor === null) {
			return;
		}

		setPositionReference({
			getBoundingClientRect: () => ({
				width: 0,
				height: 0,
				x: anchor.x,
				y: anchor.y,
				top: anchor.y,
				bottom: anchor.y,
				left: anchor.x,
				right: anchor.x,
			}),
		});
	}, [anchor, setPositionReference]);

	// Arrow keys walk past what cannot be picked.
	const disabledIndices = useMemo(
		() => items.flatMap((item, index) => (item.disabled ? [index] : [])),
		[items],
	);

	const { getFloatingProps, getItemProps } = useInteractions([
		useDismiss(context, { outsidePressEvent: 'pointerdown' }),
		useRole(context, { role: 'menu' }),

		useListNavigation(context, {
			listRef: itemRefs,
			activeIndex,
			onNavigate: setActiveIndex,
			disabledIndices,
			loop: true,

			// Nothing is highlighted until an arrow key asks for it, the way the desktop's own menus behave.
			focusItemOnOpen: false,
		}),
	]);

	const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
		duration: { open: ANIMATION_MS, close: instantClose ? 0 : ANIMATION_MS },
		initial: { opacity: 0, transform: `scale(${ ANIMATION_SCALE })` },
		open: { opacity: 1, transform: 'scale(1)' },

		// Grow out of the corner the cursor is on, so the menu appears to come from the pointer wherever it opened.
		common: ({ placement }) => ({ transformOrigin: cursorCorner(placement) }),
	});

	/**
	 * Drops the items once the menu has animated out.
	 */
	useEffect(() => {
		if (isMounted || items.length === 0) {
			return;
		}

		clear();
	}, [isMounted, items.length, clear]);

	/**
	 * Picking something takes the menu away on the spot without animation.
	 */
	const handleSelect = (item: ContextMenuItem) => {
		close({ instant: true });

		item.onSelect();
	};

	if (!isMounted) {
		return null;
	}

	return (
		<FloatingPortal id={ MENU_ROOT_ID }>
			<FloatingFocusManager
				context={ context }
				// The menu itself takes focus, so the arrow keys have somewhere to land without an item looking picked.
				initialFocus={ floatingRef }
				// Whatever a picked item opened - a modal, a dialog - should keep the focus it just took.
				returnFocus={ !instantClose }
				modal={ false }
			>
				<div
					ref={ setFloating }
					style={ { ...floatingStyles, zIndex: MENU_Z_INDEX } }
					{ ...getFloatingProps() }
					tabIndex={ -1 }
					className="outline-none"
				>
					<div
						style={ transitionStyles }
						onContextMenu={ (event) => event.preventDefault() }
						className="min-w-55 rounded-xl border border-os-border bg-os-surface p-1.5 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.4)] backdrop-blur-md select-none"
					>
						{ items.map((item, index) => (
							<Fragment key={ item.id }>
								{ item.separatorBefore && <div role="separator" className="my-1 h-px bg-os-border opacity-50"/> }

								<button
									type="button"
									disabled={ item.disabled }
									ref={ (node) => {
										itemRefs.current[index] = node;
									} }
									{ ...getItemProps({ onClick: () => handleSelect(item) }) }
									role="menuitem"
									className={ cn(
										'flex w-full cursor-pointer items-center gap-2 rounded-md p-1.5 text-left whitespace-nowrap transition-colors outline-none',
										'mb-0.5 last:mb-0',
										'hover:bg-white/4 focus:bg-white/4',
										'disabled:pointer-events-none disabled:cursor-default disabled:opacity-50',
										item.danger ? 'text-os-error' : 'text-os-text hover:text-white focus:text-white',
									) }
								>
									{ item.icon && <item.icon size={ 16 } aria-hidden className="shrink-0"/> }
									{ item.label }
								</button>
							</Fragment>
						)) }
					</div>
				</div>
			</FloatingFocusManager>
		</FloatingPortal>
	);
};
