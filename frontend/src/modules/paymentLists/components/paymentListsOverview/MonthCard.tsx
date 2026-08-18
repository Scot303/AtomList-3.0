import { Lock } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip/Tooltip.tsx';
import { cn } from '@/lib/cn.ts';
import { formatCurrency } from '@/lib/locale.ts';
import { MonthCardTabs } from './MonthCardTabs.tsx';
import { monthName } from '@/components/ui/fields/dateUtils';
import type { ListSummaryView, MonthSummaryView } from '../../types/types.ts';


const NOTHING = '—';


interface MonthCardProps {
	summary: MonthSummaryView;
}


/**
 * One month of the year: how far each of its two lists has got, and the money around them.
 */
export const MonthCard = ({ summary }: MonthCardProps) => {
	const lock = describeLock(summary);

	return (
		<div className="group/card relative flex min-h-0 self-start flex-col w-50 2xl:w-70 3xl:w-87">
			<div className={ cn(
				'styled-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl',
				'max-h-25 2xl:max-h-48 3xl:max-h-60',
				'p-3 2xl:p-4 2xl:pt-3 3xl:p-5'
			) }>
				<h3 className="flex items-center justify-center gap-1.5 font-bold text-os-text text-xs 2xl:text-lg 3xl:text-xl">
					{ monthName(summary.month) }

					{ lock !== null && (
						<>
							<Tooltip content={ lock.hint } focusable={ false }>
								<Lock aria-hidden className={ cn(
									'size-3 2xl:size-4 3xl:size-4.5 shrink-0 text-os-primary',
									lock.partial && 'text-os-warning',
								) }/>
							</Tooltip>
							<span className="sr-only">{ lock.hint }</span>
						</>
					) }
				</h3>

				<div className="mt-3 2xl:mt-2 3xl:mt-3 flex flex-col gap-1 text-[10px] 2xl:text-sm 3xl:text-base will-change-transform">
					<Counter label="Płatności TURNIEJOWE:" list={ summary.tournament }/>
					<Counter label="Płatności OPEN:" list={ summary.open }/>
				</div>

				<div className="hidden 2xl:block">
					<hr className="my-2 3xl:my-3 border-os-border/60"/>

					<div className="flex flex-col gap-1 text-sm 3xl:text-base">
						<Figure label="Brakująca kwota:" amount={ summary.outstandingTotal }/>
					</div>

					<div className="mt-2 3xl:mt-3 flex flex-col gap-1 text-sm 3xl:text-base">
						<Figure label="Dodatkowe wydatki:" amount={ summary.expenseTotal }/>
						<Figure label="Dodatkowe przychody:" amount={ summary.incomeTotal }/>
					</div>
				</div>
			</div>

			<MonthCardTabs summary={ summary }/>
		</div>
	);
};

/**
 * How much of one list is dealt with. Green only once nothing on it is outstanding.
 */
const Counter = ({ label, list }: { label: string; list: ListSummaryView | null }) => (
	<div className="flex items-baseline justify-between gap-2">
		<span className="truncate text-os-text-muted">{ label }</span>

		{ list === null ? (
			<span className="shrink-0 tabular-nums text-os-text-muted">{ NOTHING }</span>
		) : (
			<span className={ cn('shrink-0 font-bold tabular-nums', list.settledCount >= list.totalCount ? 'text-os-green' : 'text-os-error') }>
				{ list.settledCount } / { list.totalCount }
			</span>
		) }
	</div>
);

/**
 * A money line. A null amount is one this user may not read, which is not the same as zero and must not read as one.
 */
const Figure = ({ label, amount }: { label: string; amount: number | null }) => (
	<div className="flex items-baseline justify-between gap-2">
		<span className="truncate text-os-text-muted">{ label }</span>

		<span className={ cn('shrink-0 tabular-nums', amount === null ? 'text-os-text-muted' : 'text-os-text') }>{ amount === null ? NOTHING : formatCurrency(amount) }</span>
	</div>
);


/**
 * Whether to mark the month as closed.
 */
function describeLock(summary: MonthSummaryView): { hint: string; partial: boolean } | null {
	const existing = [summary.tournament, summary.open].filter((list): list is ListSummaryView => list !== null);
	const closed = existing.filter((list) => list.closed);

	if (closed.length === 0) {
		return null;
	}

	if (closed.length === existing.length) {
		return {
			hint: existing.length === 1 ? 'Lista tego miesiąca jest zamknięta' : 'Obie listy tego miesiąca są zamknięte',
			partial: false,
		};
	}

	const which = summary.tournament?.closed === true ? 'TURNIEJOWA' : 'OPEN';

	return { hint: `Zamknięta jest tylko lista ${ which }`, partial: true };
}
