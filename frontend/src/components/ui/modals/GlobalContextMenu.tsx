import { Fragment } from 'react';
import { Item, Menu, Separator } from 'react-contexify';
import { useCloseOnNavigate } from '@/hooks/useCloseOnNavigate';
import { CONTEXT_MENU_ID, dismissContextMenu, useContextMenuStore } from '@/stores/menuStore.ts';

/**
 * The one context menu on the page. Mounted once, near the root; everything else fills it through `useContextMenu()(event, items)`.
 */
export const GlobalContextMenu = () => {
	const items = useContextMenuStore((state) => state.items);

	useCloseOnNavigate(dismissContextMenu);

	return (
		<Menu id={ CONTEXT_MENU_ID } animation="scale">
			{ items.map((item) => (
				<Fragment key={ item.id }>
					{ item.separatorBefore && <Separator/> }

					<Item
						id={ item.id }
						disabled={ item.disabled }
						onClick={ item.onSelect }
						className={ item.danger ? 'menu-item-destructive' : undefined }
					>
						<span className="flex items-center gap-2">
							{ item.icon && <item.icon size={ 15 } aria-hidden className="shrink-0"/> }
							{ item.label }
						</span>
					</Item>
				</Fragment>
			)) }
		</Menu>
	);
};
