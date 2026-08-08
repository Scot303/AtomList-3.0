import type { ReactNode } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import type { SelectPopoverState } from '@/hooks/useSelectPopover';


interface SelectPopoverProps {
	popover: SelectPopoverState;
	children: ReactNode;
}


export function SelectPopover({ popover, children }: SelectPopoverProps) {
	const { isMounted, isTriggerHidden, setFloating, floatingStyles, transitionStyles, getFloatingProps, maxHeight } = popover;

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
					/*
					 * Hidden rather than unmounted while the trigger is out of view, so whatever the user
					 * had going in the panel - a half-typed search, an open add-new form - is still there
					 * when they scroll back to it.
					 */
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
