import type { ReactNode } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import type { SelectPopoverState } from '@/hooks/useSelectPopover';


interface SelectPopoverProps {
	popover: SelectPopoverState;
	children: ReactNode;
}


export function SelectPopover({ popover, children }: SelectPopoverProps) {
	const { isMounted, setFloating, floatingStyles, transitionStyles, getFloatingProps } = popover;

	if (!isMounted) {
		return null;
	}

	return (
		<FloatingPortal>
			<div
				ref={ setFloating }
				style={ { ...floatingStyles, zIndex: 9999 } }
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
