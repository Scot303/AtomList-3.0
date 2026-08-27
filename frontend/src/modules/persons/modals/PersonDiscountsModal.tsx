import { Ban } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { MONTH_NAMES } from '@/utils/dateUtils.ts';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/locale';
import { FamilyDiscountSection } from '../components/discountBreakdown/FamilyDiscountSection';
import { GroupCountDiscountSection } from '../components/discountBreakdown/GroupCountDiscountSection';
import { usePersonDiscounts } from '../hooks/mutations/usePersonDiscounts.ts';
import type { PersonDiscountView } from '../types/types.ts';


interface PersonDiscountsModalProps {
	personId: string;
	personName: string;
}


/**
 * Why one person's discount comes out the way it does.
 *
 * Reads back the whole calculation rather than only its result: the two ladders, which rung of each was matched,
 * the household order and the figure it was decided on, and the memberships the group count was read off.
 */
export default function PersonDiscountsModal({ personId }: PersonDiscountsModalProps) {
	const discounts = usePersonDiscounts(personId);

	if (discounts.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (discounts.isError) {
		return <Alert tone="danger">{ discounts.error.message }</Alert>;
	}

	return <Breakdown discount={ discounts.data }/>;
}


function Breakdown({ discount }: { discount: PersonDiscountView }) {
	return (
		<div className="mt-2 space-y-6">
			<div className="flex flex-row items-stretch gap-4">
				<div className="flex-1">
					<Total
						percent={ discount.totalPercent }
						month={ monthLabel(discount.year, discount.month) }
						billed={ discount.billed }
					/>
				</div>

				<div className="flex-1">
					<Alert tone="warning" title="Zniżki wyliczone na teraz, nie wstecz." className="h-full text-base" contentClassName="text-sm">
						Kwoty na już zamkniętej liście mają zapisany własny procent i nie zmieniają się po edycji drabinki.
					</Alert>
				</div>
			</div>

			{ !discount.billed ? (
				<NotBilled active={ discount.active }/>
			) : (
				<>
					<FamilyDiscountSection component={ discount.familyDiscount } household={ discount.household }/>

					<GroupCountDiscountSection component={ discount.groupCountDiscount } memberships={ discount.memberships }/>

					<Sum
						familyPercent={ discount.familyDiscount.percent }
						groupCountPercent={ discount.groupCountDiscount.percent }
						total={ discount.totalPercent }
						capped={ discount.capped }
					/>
				</>
			) }
		</div>
	);
}


interface TotalProps {
	percent: number;
	month: string;
	billed: boolean;
}


/**
 * The figure everything below explains.
 */
function Total({ percent, month, billed }: TotalProps) {
	return (
		<div className="styled-card flex items-center shrink-0 flex-col gap-1 rounded-2xl px-5 py-4">
			<p className="text-lg font-semibold tracking-wide text-os-text-muted uppercase">Zniżka na { month }</p>

			<p className={ cn('text-3xl font-bold', billed ? 'text-os-green' : 'text-os-text-muted') }>
				{ formatPercent(percent) }
			</p>
		</div>
	);
}


/**
 * Nothing is charged, so neither ladder was consulted.
 */
function NotBilled({ active }: { active: boolean }) {
	return (
		<Alert tone="info" title="Skąd 0%" className="text-base" contentClassName="text-sm">
			{ active
				? 'Ta osoba nie ma w tym miesiącu żadnej aktywnej grupy, więc nie ma za co wyliczyć zniżki.'
				: 'Ta osoba jest nieaktywna, więc nie jest rozliczana.' }
			{ ' ' }
			Nie zajmuje też miejsca w drabince rodzinnej - rodzeństwo nie przesuwa się z tego powodu w dół.
		</Alert>
	);
}


interface SumProps {
	familyPercent: number;
	groupCountPercent: number;
	total: number;
	capped: boolean;
}


function Sum({ familyPercent, groupCountPercent, total, capped }: SumProps) {
	return (
		<section className="space-y-2 border-t border-os-border-highlight pt-4">
			<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base">
				<span>Razem: </span>
				<span>{ formatPercent(familyPercent) } (rodzina)</span>
				<span>+</span>
				<span>{ formatPercent(groupCountPercent) } (grupy)</span>
				<span>=</span>
				<span className="font-semibold text-os-green">{ formatPercent(total) }</span>
			</div>

			{ capped && (
				<Alert tone="warning" className="mt-2">
					<span className="inline-flex items-center gap-1.5">
						<Ban size={ 14 } aria-hidden className="shrink-0"/>
						Progi sumują się powyżej 100%, więc zniżka została przycięta do 100%.
					</span>
				</Alert>
			) }
		</section>
	);
}


/** The month the preview is for, as the heading names it. */
function monthLabel(year: number, month: number): string {
	return `${ MONTH_NAMES[month - 1] } ${ year }`;
}
