import { useLayoutEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/buttons/Button.tsx';
import { useMediaQuery } from '@/hooks/useMediaQuery.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { useModalStore } from '@/stores/modalStore.ts';
import { CustomListRow } from './CustomListRow.tsx';
import { useCustomListMenu } from '../../hooks/contextMenu/useCustomListMenu.ts';
import type { PaymentListView } from '../../types/types.ts';


const ROW_HEIGHT = {
	default: 48,
	'2xl': 64,
	'3xl': 80,
};

const ROW_OVERSCAN = 10;


interface CustomListsPanelProps {
	lists: PaymentListView[];
	isLoading: boolean;
}


export const CustomListsPanel = ({ lists, isLoading }: CustomListsPanelProps) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const is2xl = useMediaQuery('(min-width: 1536px)');
	const is3xl = useMediaQuery('(min-width: 130rem)');
	const rowHeight = is3xl ? ROW_HEIGHT['3xl'] : is2xl ? ROW_HEIGHT['2xl'] : ROW_HEIGHT.default;

	const { hasPermission } = useAuth();
	const openModal = useModalStore((state) => state.openModal);

	const buildMenu = useCustomListMenu();

	const rowVirtualizer = useVirtualizer({
		count: lists.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => rowHeight,
		overscan: ROW_OVERSCAN,
		getItemKey: (index) => lists[index]?.id ?? index,
	});

	useLayoutEffect(() => {
		rowVirtualizer.measure();
	}, [rowHeight, rowVirtualizer]);

	return (
		<section className="styled-card flex h-full min-h-0 flex-col rounded-2xl">
			<header className="shrink-0 border-b border-os-border/60 py-2 2xl:py-3 3xl:py-4">
				<h2 className="text-sm 2xl:text-lg 3xl:text-xl font-bold text-center text-os-text">Listy niestandardowe</h2>
			</header>

			<div ref={ scrollRef } className="min-h-0 flex-1 overflow-y-auto themed-scrollbar p-1.5">
				{ lists.length === 0 ? (
					<p className="px-2 py-4 text-center text-xs 2xl:text-sm 3xl:text-lg text-os-text-muted">
						{ isLoading ? '' : 'Brak niestandardowych list' }
					</p>
				) : (
					<div style={ { height: rowVirtualizer.getTotalSize(), position: 'relative' } }>
						{ rowVirtualizer.getVirtualItems().map((item) => (
							<div
								key={ item.key }
								style={ {
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: rowHeight,
									transform: `translateY(${ item.start }px)`,
								} }
							>
								<CustomListRow list={ lists[item.index] } buildMenu={ buildMenu }/>
							</div>
						)) }
					</div>
				) }
			</div>

			{ hasPermission('MODIFY_LISTS') && (
				<footer className="mt-2 shrink-0 border-t border-os-border/60 p-2 2xl:p-3">
					<Button
						size="md"
						variant="secondary"
						className="w-full"
						leftIcon={ <Plus size={ 16 }/> }
						onClick={ () => void openModal('lists.customForm', {}) }
					>
						Dodaj listę
					</Button>
				</footer>
			) }
		</section>
	);
};
