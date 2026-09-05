import { useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { MonthSwitcher } from '@/components/shared/MonthSwitcher.tsx';
import { ScopeTotals } from '@/components/shared/ScopeTotals.tsx';
import { cn } from '@/lib/cn';
import { formatCurrency, formatPercent } from '@/lib/locale';
import { currentYearMonth } from '@/utils/dateUtils.ts';
import { usePersonDiscounts, usePrefetchPersonDiscounts } from '../../hooks/queries/usePersonDiscounts.ts';
import type { PersonDiscountView } from '../../types/types.ts';
import { PersonFeesTable } from './PersonFeesTable.tsx';


interface PersonFeesSectionProps {
	personId: string;
}


/**
 * What this person is billed month after month, for whichever month is on screen.
 */
export function PersonFeesSection({ personId }: PersonFeesSectionProps) {
	const [period, setPeriod] = useState(currentYearMonth);

	const discounts = usePersonDiscounts(personId, period.year, period.month);
	const prefetchDiscounts = usePrefetchPersonDiscounts();

	return (
		<section className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3 px-1">
				<h3 className="text-base font-bold tracking-wide text-os-primary uppercase">Stałe opłaty</h3>

				<MonthSwitcher
					year={ period.year }
					month={ period.month }
					onChange={ (year, month) => setPeriod({ year, month }) }
					onPrime={ (year, month) => prefetchDiscounts(personId, year, month) }
				/>
			</div>

			{ discounts.isPending ? (
				<div className="flex justify-center py-10">
					<Spinner/>
				</div>
			) : discounts.isError ? (
				<Alert tone="danger">{ discounts.error.message }</Alert>
			) : (
				<div className={ cn('space-y-3', discounts.isPlaceholderData && 'opacity-60') } aria-busy={ discounts.isPlaceholderData }>
					<Fees discount={ discounts.data }/>
				</div>
			) }
		</section>
	);
}


function Fees({ discount }: { discount: PersonDiscountView }) {
	if (!discount.active) {
		return (
			<Alert tone="info" contentClassName="text-sm">
				Ta osoba jest nieaktywna, więc nie trafia na listę miesięczną i nie ma żadnych stałych opłat.
			</Alert>
		);
	}

	if (discount.memberships.length === 0) {
		return (
			<Alert tone="info" contentClassName="text-sm">
				Ta osoba nie uczęszcza w tym miesiącu do żadnej grupy, więc za nic nie płaci.
			</Alert>
		);
	}

	const saved = discount.totals.total.discount;

	return (
		<>
			<PersonFeesTable memberships={ discount.memberships }/>

			<div className="flex flex-wrap items-start gap-3">
				{ saved > 0 && (
					<p className="flex flex-wrap items-center gap-2 px-1 text-sm">
						<PiggyBank aria-hidden className="size-5 shrink-0 text-os-green"/>
						<span className="text-os-text-muted">Zniżka</span>
						<span className="font-semibold text-os-green">{ formatPercent(discount.totalPercent) }</span>
						<span className="text-os-text-muted">zmniejsza łącznie kwotę o</span>
						<span className="font-semibold text-os-green">{ formatCurrency(saved) }</span>
					</p>
				) }

				<ScopeTotals
					gross={ { open: discount.totals.open.gross, tournament: discount.totals.tournament.gross, total: discount.totals.total.gross } }
					priced={ discount.totals }
					title="Suma Miesięcznych opłat"
					className="ml-auto w-full max-w-80 sm:w-80"
				/>
			</div>
		</>
	);
}
