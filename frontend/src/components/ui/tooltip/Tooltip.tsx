import type { ReactNode } from 'react';
import { useState } from 'react';
import type { Placement } from '@floating-ui/react';
import { arrow, autoUpdate, flip, FloatingArrow, FloatingPortal, offset, shift, useDismiss, useFloating, useFocus, useHover, useInteractions, useRole, useTransitionStyles, } from '@floating-ui/react';
import { cn } from '@/lib/cn';


/** Distance between the trigger and the bubble, arrow excluded. */
const GAP = 10;

/** How close to the viewport edge the bubble may sit before it is nudged back. */
const VIEWPORT_PADDING = 8;

const ARROW_WIDTH = 10;
const ARROW_HEIGHT = 5;

/** Long enough that the bubble does not flash while the pointer crosses the trigger on its way elsewhere. */
const OPEN_DELAY = 250;


interface TooltipProps {
	/** What the tooltip says. */
	content: ReactNode;
	placement?: Placement;
	/** Milliseconds the pointer must rest on the trigger before the bubble appears. */
	delay?: number;
	/**
	 * A tab stop, so keyboard users can reach the hint too. Turn it off when the trigger is
	 * already focusable on its own - a button, a link - which would otherwise nest two of them.
	 */
	focusable?: boolean;
	/** Applied to the wrapper around the trigger, not to the bubble. */
	className?: string;
	children: ReactNode;
}


/**
 * A themed replacement for the browser's `title` tooltip.
 */
export function Tooltip(props: TooltipProps) {
	const {
		content,
		placement = 'top',
		delay = OPEN_DELAY,
		focusable = true,
		className,
		children,
	} = props;

	const [open, setOpen] = useState(false);
	const [arrowEl, setArrowEl] = useState<SVGSVGElement | null>(null);

	const { refs, floatingStyles, context } = useFloating({
		open,
		onOpenChange: setOpen,
		placement,

		// The trigger may sit inside a scrolling container; fixed keeps the bubble with it.
		strategy: 'fixed',
		whileElementsMounted: autoUpdate,

		middleware: [
			offset(GAP),
			flip({ padding: VIEWPORT_PADDING }),
			shift({ padding: VIEWPORT_PADDING }),
			arrow({ element: arrowEl }),
		],
	});

	const { setReference, setFloating } = refs;

	const { getReferenceProps, getFloatingProps } = useInteractions([
		useHover(context, { move: false, delay: { open: delay, close: 0 } }),
		useFocus(context),

		// A tap on a touch screen opens the bubble; the same tap should be able to send it away again.
		useDismiss(context, { referencePress: true }),
		useRole(context, { role: 'tooltip' }),
	]);

	const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
		duration: { open: 150, close: 100 },
		initial: { opacity: 0, transform: 'scale(0.96)' },
		open: { opacity: 1, transform: 'scale(1)' },
	});

	return (
		<>
			<span
				ref={ setReference }
				tabIndex={ focusable ? 0 : undefined }
				className={ cn(
					'inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-os-primary',
					className,
				) }
				{ ...getReferenceProps() }
			>
				{ children }
			</span>

			{ isMounted && (
				<FloatingPortal>
					<div
						ref={ setFloating }
						style={ { ...floatingStyles, zIndex: 9999 } }
						{ ...getFloatingProps() }
					>
						<div
							style={ transitionStyles }
							className="popover-surface max-w-xs rounded-lg px-2.5 py-1.5 text-xs leading-snug text-os-text"
						>
							{ content }

							<FloatingArrow
								ref={ setArrowEl }
								context={ context }
								width={ ARROW_WIDTH }
								height={ ARROW_HEIGHT }
								fill="var(--color-os-surface-dark)"
								stroke="var(--color-os-border)"
								strokeWidth={ 1 }
							/>
						</div>
					</div>
				</FloatingPortal>
			) }
		</>
	);
}
