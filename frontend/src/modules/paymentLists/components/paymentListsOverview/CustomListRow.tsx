import { Lock, TreePalm } from 'lucide-react';
import { useNavigate } from 'react-router';
import { formatInstantDate } from '@/components/ui/fields/dateUtils.ts';
import { Tooltip } from '@/components/ui/tooltip/Tooltip.tsx';
import { cn } from '@/lib/cn.ts';
import { paymentListDetailPath } from '@/routes/paths.ts';
import type { PaymentListView } from '../../types/types.ts';


interface CustomListRowProps {
	list: PaymentListView;
}


export const CustomListRow = ({ list }: CustomListRowProps) => {
	const navigate = useNavigate();

	const camp = list.type === 'CAMP';

	return (
		<button
			type="button"
			onClick={ () => void navigate(paymentListDetailPath(list.id)) }
			className={ cn(
				'flex h-full w-full cursor-pointer flex-col justify-center gap-0.5 rounded-xl px-3 py-1 text-left',
				'2xl:gap-1 2xl:px-4 2xl:py-2 3xl:px-5 3xl:py-3',
				'transition-colors outline-none hover:bg-os-bg-highlight',
				'focus-visible:bg-os-bg-highlight focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-os-primary/40',
			) }
		>
			<span className="flex items-center gap-1.5 2xl:gap-2 3xl:gap-2.5">
				{ camp && (
					<Tooltip content="Lista obozowa" focusable={ false }>
						<TreePalm size={ 13 } aria-hidden className="h-3.5 w-3.5 shrink-0 text-os-primary 2xl:h-4 2xl:w-4 3xl:h-5 3xl:w-5"/>
					</Tooltip>
				) }
				{ camp && <span className="sr-only">Lista obozowa</span> }

				<span className="truncate text-xs font-bold text-os-text 2xl:text-base 3xl:text-lg">{ list.name ?? 'Bez nazwy' }</span>

				{ list.closed && (
					<Tooltip content="Lista jest zamknięta" focusable={ false }>
						<Lock size={ 12 } aria-hidden className="h-3 w-3 shrink-0 text-os-primary 2xl:h-3.5 2xl:w-3.5 3xl:h-4 3xl:w-4"/>
					</Tooltip>
				) }
				{ list.closed && <span className="sr-only">Lista zamknięta</span> }
			</span>

			<span className="text-os-text-muted text-[10px] 2xl:text-sm 3xl:text-base">{ formatInstantDate(list.createdAt) }</span>
		</button>
	);
};
