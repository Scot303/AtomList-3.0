import { AlertTriangle, Ban } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { currentYearMonth, MONTH_NAMES } from '@/utils/dateUtils.ts';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/locale';
import { FamilyDiscountSection } from '../components/discountBreakdown/FamilyDiscountSection';
import { GroupCountDiscountSection } from '../components/discountBreakdown/GroupCountDiscountSection';
import { StudentDiscountSection } from '../components/discountBreakdown/StudentDiscountSection';
import { usePersonDiscounts } from '../hooks/queries/usePersonDiscounts.ts';
import type { PersonDiscountView } from '../types/types.ts';


interface PersonDiscountsModalProps {
	personId: string;
	personName: string;
}


/**
 * Why one person's discount comes out the way it does.
 *
 * Reads back the whole calculation rather than only its result: the two ladders, which rung of each was matched,
 * the household order and the figure it was decided on, the memberships the group count was read off, and whether
 * the flat student rate was added on top.
 */
export default function PersonDiscountsModal({ personId }: PersonDiscountsModalProps) {
	const { year, month } = currentYearMonth();

	const discounts = usePersonDiscounts(personId, year, month);

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
		<div className="mt-2 space-y-4">
			<Total
				percent={ discount.totalPercent }
				month={ monthLabel(discount.year, discount.month) }
				billed={ discount.billed }
				student={ discount.studentDiscount }
			/>

			{ !discount.billed ? (
				<NotBilled active={ discount.active }/>
			) : (
				<>
					<div className="rounded-2xl border border-os-border p-4 pt-3">
						<FamilyDiscountSection component={ discount.familyDiscount } household={ discount.household }/>
					</div>

					<div className="rounded-2xl border border-os-border p-4 pt-3">
						<GroupCountDiscountSection component={ discount.groupCountDiscount } memberships={ discount.memberships }/>
					</div>

					<div className="rounded-2xl border border-os-border p-4 pt-3">
						<StudentDiscountSection held={ discount.studentDiscount } percent={ discount.studentPercent }/>
					</div>

					<Sum
						familyPercent={ discount.familyDiscount.percent }
						groupCountPercent={ discount.groupCountDiscount.percent }
						hasStudentDiscount={ discount.studentDiscount }
						studentPercent={ discount.studentPercent }
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
	student: boolean;
}


/**
 * The figure everything below explains.
 */
function Total({ percent, month, billed }: TotalProps) {
	return (
		<div className="styled-card flex w-full min-w-0 items-center gap-3 rounded-2xl px-5 py-2">
			<p className="min-w-0 flex-1 truncate text-lg font-semibold tracking-wide text-os-text-muted uppercase">Zniżka na { month }</p>

			<p className={ cn('shrink-0 text-2xl font-bold', billed ? 'text-os-green' : 'text-os-text-muted') }>
				{ formatPercent(percent) }
			</p>

			<Tooltip
				content="Zniżki wyliczone na teraz, nie wstecz. Kwoty na już zamkniętej liście mają zapisany własny procent i nie zmieniają się po edycji drabinki."
				className="shrink-0 text-os-warning"
				placement="bottom"
			>
				<AlertTriangle aria-hidden className="size-5"/>
				<span className="sr-only">Zniżki wyliczone na teraz, nie wstecz.</span>
			</Tooltip>
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
			Nie zajmuje też miejsca w drabince rodzinnej.
		</Alert>
	);
}


interface SumProps {
	familyPercent: number;
	groupCountPercent: number;
	hasStudentDiscount: boolean;
	studentPercent: number;
	total: number;
	capped: boolean;
}


function Sum({ familyPercent, groupCountPercent, hasStudentDiscount, studentPercent, total, capped }: SumProps) {
	return (
		<section className="space-y-2 border-t border-os-border-highlight pt-4 px-3">
			<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-base">
				<span>Razem: </span>
				<span>{ formatPercent(familyPercent) } (rodzina)</span>
				<span>+</span>
				<span>{ formatPercent(groupCountPercent) } (grupy)</span>
				{ hasStudentDiscount && (
					<>
						<span>+</span>
						<span>{ formatPercent(studentPercent) } (zniżka studencka)</span>
					</>
				) }
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
