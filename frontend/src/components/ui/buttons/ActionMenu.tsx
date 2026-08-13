import { Fragment } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn.ts';
import type { PopoverState } from '@/hooks/usePopover.ts';
import { Popover } from '../popover/Popover.tsx';


export interface ActionMenuItem {
	id: string;
	label: string;
	icon?: LucideIcon;
	onSelect: () => void;
	disabled?: boolean;
	danger?: boolean;
	/** Draws a divider above this item. */
	separatorBefore?: boolean;
}

interface ActionMenuProps {
	state: PopoverState;
	items: ActionMenuItem[];
	ariaLabel?: string;
}


/**
 * A list of actions hanging off the button that opened it.
 */
export function ActionMenu({ state, items, ariaLabel }: ActionMenuProps) {
	const { close } = state;

	/** The menu is gone before the action runs, so whatever it opens takes the focus the menu is giving up. */
	const select = (item: ActionMenuItem) => {
		close();
		item.onSelect();
	};

	return (
		<Popover state={ state }>
			<div
				aria-label={ ariaLabel }
				className="popover-surface min-w-55 rounded-xl p-1.5 select-none"
			>
				{ items.map((item) => (
					<Fragment key={ item.id }>
						{ item.separatorBefore && <div role="separator" className="my-1 h-px bg-os-border opacity-50"/> }

						<button
							type="button"
							disabled={ item.disabled }
							onClick={ () => select(item) }
							className={ cn(
								'flex w-full cursor-pointer items-center gap-2 rounded-md p-1.5 text-left text-sm whitespace-nowrap transition-colors outline-none',
								'mb-0.5 last:mb-0',
								'hover:bg-white/4 focus-visible:bg-white/4',
								'disabled:pointer-events-none disabled:cursor-default disabled:opacity-50',
								item.danger ? 'text-os-error' : 'text-os-text hover:text-white focus-visible:text-white',
							) }
						>
							{ item.icon && <item.icon size={ 16 } aria-hidden className="shrink-0"/> }
							{ item.label }
						</button>
					</Fragment>
				)) }
			</div>
		</Popover>
	);
}
