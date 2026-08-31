import type { ReactNode } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import type { PopoverState } from '@/hooks/usePopover';


interface PopoverProps {
	state: PopoverState;
	children: ReactNode;
}


/**
 * The panel half of a popover: portalled out to the body, placed against whatever opened it, and kept there.
 */
export function Popover({ state, children }: PopoverProps) {
	const { isMounted, isTriggerHidden, setFloating, floatingStyles, transitionStyles, getFloatingProps, maxHeight } = state;

	if (!isMounted) {
		return null;
	}

	return (
		<FloatingPortal>
			<div
				ref={ setFloating }
				style={ {
					...floatingStyles,
					zIndex: 9999,
					maxHeight,
					...(isTriggerHidden && { visibility: 'hidden' as const, pointerEvents: 'none' as const }),
				} }
				// Nothing invisible should be tabbable or readable.
				inert={ isTriggerHidden }
				{ ...getFloatingProps() }
				className="flex flex-col"
			>
				<div style={ transitionStyles } className="flex min-h-0 flex-1 flex-col">
					{ children }
				</div>
			</div>
		</FloatingPortal>
	);
}
