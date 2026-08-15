import { Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';

import { cn } from '@/lib/cn.ts';
import { notifyApiError } from '@/lib/toast.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { paymentListDetailPath } from '@/routes/paths.ts';
import { useOpenStandardList } from '../../hooks/useOpenStandardList.ts';
import { monthName } from '../../types/listLabels.ts';
import type { ListSummaryView, MonthSummaryView } from '../../types/types.ts';


interface MonthCardTabsProps {
	summary: MonthSummaryView;
}


/**
 * The two lists a month holds, sliding out from under the card when it is hovered or something inside it takes focus.
 */
export const MonthCardTabs = ({ summary }: MonthCardTabsProps) => {
	const navigate = useNavigate();

	const { hasPermission } = useAuth();
	const canCreate = hasPermission('MODIFY_LISTS');

	const openStandardList = useOpenStandardList();

	const open = (list: ListSummaryView | null, tournament: boolean) => {
		if (list !== null) {
			void navigate(paymentListDetailPath(list.id));
			return;
		}

		if (!canCreate || openStandardList.isPending) {
			return;
		}

		openStandardList.mutate(
			{ year: summary.year, month: summary.month, tournament },
			{
				onSuccess: (created) => void navigate(paymentListDetailPath(created.id)),
				onError: notifyApiError,
			},
		);
	};

	return (
		<div className="pointer-events-none absolute inset-x-4 top-full h-8 2xl:h-10 3xl:h-12 overflow-hidden">
			<div
				className={ cn(
					'pointer-events-auto flex overflow-hidden rounded-b-xl bg-os-surface/95',
					'border border-t-0 border-os-border',
					'-translate-y-full transition-transform duration-400 ease-out-soft will-change-transform',
					'group-hover/card:translate-y-0',
					'group-focus-within/card:translate-y-0',
					'group-hover/card:delay-200',
					'motion-reduce:transition-none',
				) }
			>
				<Tab
					label="TURNIEJOWA"
					month={ summary.month }
					list={ summary.tournament }
					canCreate={ canCreate }
					pending={ openStandardList.isPending && openStandardList.variables?.tournament }
					onOpen={ () => open(summary.tournament, true) }
				/>

				<span aria-hidden className="w-px shrink-0 bg-os-border"/>

				<Tab
					label="OPEN"
					month={ summary.month }
					list={ summary.open }
					canCreate={ canCreate }
					pending={ openStandardList.isPending && !openStandardList.variables?.tournament }
					onOpen={ () => open(summary.open, false) }
				/>
			</div>
		</div>
	);
};


interface TabProps {
	label: string;
	month: number;
	list: ListSummaryView | null;
	canCreate: boolean;
	pending: boolean;
	onOpen: () => void;
}


const Tab = ({ label, month, list, canCreate, pending, onOpen }: TabProps) => {
	const missing = list === null;

	const unavailable = missing && !canCreate;

	const period = monthName(month).toLowerCase();

	const title = unavailable ?
		`Lista ${ label } za ${ period } jeszcze nie istnieje - jej utworzenie wymaga uprawnienia do zarządzania listami`
		:
		missing ?
			`Utwórz listę ${ label } za ${ period }`
			:
			`Otwórz listę ${ label } za ${ period }${ list.closed ? ' (zamknięta)' : '' }`;

	return (
		<button
			type="button"
			aria-disabled={ unavailable || pending }
			aria-busy={ pending }
			aria-label={ title }
			title={ title }
			onClick={ () => {
				if (!unavailable && !pending) {
					onOpen();
				}
			} }
			className={ cn(
				'flex flex-1 cursor-pointer items-center justify-center gap-1.5 px-2 py-1.5 2xl:py-2 font-semibold tracking-wide',
				'text-[8px] 2xl:text-xs 3xl:text-sm',
				'transition-colors outline-none focus-visible:bg-white/3 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-os-primary',
				unavailable || pending ? 'cursor-default text-os-text-muted opacity-50' : 'text-os-text-muted hover:bg-white/3 hover:text-os-text',
				missing && !unavailable && 'text-os-warning',
			) }
		>
			{ pending && <Loader2 size={ 12 } aria-hidden className="shrink-0 animate-spin"/> }
			{ label }
			{ list?.closed === true && <Lock size={ 10 } aria-hidden className="mb-0.5 h-2 w-2 shrink-0 text-os-text 2xl:h-3 2xl:w-3 3xl:h-3.5 3xl:w-3.5"/> }
		</button>
	);
};
