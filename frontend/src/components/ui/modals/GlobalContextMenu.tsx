import { Fragment, useEffect, useState } from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { Item, Menu, Separator } from 'react-contexify';
import { useCloseOnNavigate } from '@/hooks/useCloseOnNavigate';
import { CONTEXT_MENU_ID, type ContextMenuItem, dismissContextMenu, useContextMenuStore } from '@/stores/menuStore.ts';

/** The body-level container the menu is portalled into. */
const MENU_ROOT_ID = 'app-context-menu-root';

/**
 * The one context menu on the page. Mounted once, near the root; everything else fills it through `useContextMenu()(event, items)`.
 */
export const GlobalContextMenu = () => {
	const items = useContextMenuStore((state) => state.items);
	const clear = useContextMenuStore((state) => state.clear);

	const [open, setOpen] = useState(false);
	const [instance, setInstance] = useState(0);

	useCloseOnNavigate(dismissContextMenu);
	useDismissOnOutsidePointer(open);

	/**
	 * Drops the items once the menu has animated out.
	 */
	const handleAnimationEnd = () => {
		if (!open) {
			clear();
		}
	};

	/**
	 * Picking something takes the menu away on the spot without animation.
	 */
	const handleSelect = (item: ContextMenuItem) => {
		setInstance((current) => current + 1);
		setOpen(false);
		clear();

		item.onSelect();
	};

	return (
		<FloatingPortal id={ MENU_ROOT_ID } preserveTabOrder={ false }>
			<div className="contents" onAnimationEnd={ handleAnimationEnd }>
				<Menu key={ instance } id={ CONTEXT_MENU_ID } animation="scale" onVisibilityChange={ setOpen }>
					{ items.map((item) => (
						<Fragment key={ item.id }>
							{ item.separatorBefore && <Separator/> }

							<Item
								id={ item.id }
								disabled={ item.disabled }
								closeOnClick={ false }
								onClick={ () => handleSelect(item) }
								className={ item.danger ? 'menu-item-destructive' : undefined }
							>
								<span className="flex items-center gap-2">
									{ item.icon && <item.icon size={ 16 } aria-hidden className="shrink-0"/> }
									{ item.label }
								</span>
							</Item>
						</Fragment>
					)) }
				</Menu>
			</div>
		</FloatingPortal>
	);
};

/**
 * Closes the open menu as soon as the pointer goes down anywhere else.
 */
function useDismissOnOutsidePointer(open: boolean) {
	useEffect(() => {
		if (!open) {
			return;
		}

		const dismissIfOutside = (event: PointerEvent) => {
			const onMenu = event.target instanceof Node && document.getElementById(MENU_ROOT_ID)?.contains(event.target);

			if (!onMenu) {
				dismissContextMenu();
			}
		};

		document.addEventListener('pointerdown', dismissIfOutside, true);

		return () => document.removeEventListener('pointerdown', dismissIfOutside, true);
	}, [open]);
}
