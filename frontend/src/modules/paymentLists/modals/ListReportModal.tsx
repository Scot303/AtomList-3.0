import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { formatCurrency, pluralise } from '@/lib/locale';
import { LinePanel, MoneyLine, TextLine } from '@/components/shared/MoneyLines.tsx';
import { useListReport } from '../hooks/queries/useListReport.ts';
import { coveredPersonsNames, PAYMENT_METHOD_TAGS } from '@/types/finance.ts';
import type { ListReportView, ReportDepositView } from '../types/types.ts';
import { TagBadge } from "@/components/ui/tags";


interface ListReportModalProps {
	listId: string;
}


/**
 * What the list says on paper: what it charged, what it took in, and where money that went elsewhere ended up.
 */
export default function ListReportModal({ listId }: ListReportModalProps) {
	const report = useListReport(listId);

	if (report.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (report.isError) {
		return <Alert tone="danger">{ report.error.message }</Alert>;
	}

	return <Report report={ report.data }/>;
}


function Report({ report }: { report: ListReportView }) {
	const { totals } = report;

	// Mirrors the backend's `PaymentList.yearMonth()`, which is what decides whose money the sheet reports.
	const billsAMonth = report.year !== null && report.month !== null;
	const foreignLabel = billsAMonth ? 'z innego okresu' : 'przychód innej listy';
	const foreignCount = report.cashIn.filter((deposit) => !deposit.belongsHere).length;

	return (
		<div className="mt-2 space-y-5">
			{ !totals.reconciles && (
				<Alert tone="danger" title="Kwoty się nie zgadzają">
					System wykrył różne wyniki między sumą po płatnościach i sumą po wpłatach.
				</Alert>
			) }

			<LinePanel title="Podsumowanie">
				<TextLine label="Płatności na liście:">
					{ totals.settledCount } / { totals.rowCount } rozliczonych
				</TextLine>

				<MoneyLine label="Całkowita kwota do zapłacenia na liście:" amount={ totals.billedTotal } tone="strong"/>
				<MoneyLine label="Wpłacona kwota w tym miesiącu:" amount={ totals.collectedTotal } tone="good"/>
				<MoneyLine label="Kwota pochodząca z innego okresu:" amount={ totals.clearedElsewhereTotal }/>
				<MoneyLine
					label="Pozostaje do zapłaty:"
					amount={ totals.outstandingTotal }
					tone={ totals.outstandingTotal > 0 ? 'bad' : 'good' }
					separated
				/>
			</LinePanel>

			<LinePanel title={ billsAMonth ? 'Wpłaty przyjęte w tym okresie' : 'Wpłaty przyjęte na tej liście' }>
				<MoneyLine label="Przyjęto łącznie:" amount={ totals.depositsReceivedTotal } tone="strong"/>
				<MoneyLine label="Kwota rozliczona na tej liście:" amount={ totals.depositsCountedHereTotal }/>

				{ totals.depositsClearedHereTotal !== 0 && (
					<MoneyLine label="Kwota rozliczona na tej liście po jej zamknięciu:" amount={ totals.depositsClearedHereTotal }/>
				) }

				<MoneyLine label="Kwota rozliczona na innych listach:" amount={ totals.depositsSpentElsewhereTotal }/>
				<MoneyLine label="Nierozdysponowana nadpłata:" amount={ totals.depositsUnallocatedTotal }/>
			</LinePanel>

			<section className="space-y-2">
				<div className="flex items-baseline justify-between gap-3 px-1">
					<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Wpłaty</h3>

					<span className="text-sm text-os-text-muted">
						{ report.cashIn.length } { pluralise(report.cashIn.length, 'wpłata', 'wpłaty', 'wpłat') }
						{ foreignCount > 0 && ` (${ foreignCount } ${ foreignLabel })` }
					</span>
				</div>

				{ report.cashIn.length === 0 ? (
					<Alert tone="info" contentClassName="text-sm">
						{ billsAMonth ? 'W tym okresie nie przyjęto jeszcze żadnych pieniędzy.' : 'Na tę listę nie wpłynęły jeszcze żadne pieniądze.' }
					</Alert>
				) : (
					<ul className="space-y-3">
						{ report.cashIn.map((deposit) => (
							<DepositRow key={ deposit.depositId } deposit={ deposit } foreignLabel={ foreignLabel }/>
						)) }
					</ul>
				) }
			</section>
		</div>
	);
}


interface DepositRowProps {
	deposit: ReportDepositView;
	/** What to call money the sheet lists but does not own - which depends on whether the sheet bills a month. */
	foreignLabel: string;
}


/**
 * One deposit, and the three ways its money can have been used - which always add up to what was received.
 */
function DepositRow({ deposit, foreignLabel }: DepositRowProps) {
	// What paid for something here, whether or not it counts as this sheet's income.
	// A deposit from another period settles charges without being income, and calling that "spent elsewhere" would be a lie about the very sheet it paid for.
	const settledHere = deposit.countedOnThisList + deposit.clearedOnThisList;

	return (
		<li className="styled-card rounded-xl px-3.5 py-2.5">
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<span className="text-sm font-semibold text-os-text">
					<span className="text-os-primary font-bold">#{ deposit.ref }</span> · { coveredPersonsNames(deposit.coveredPersons) }
				</span>

				<span className="text-sm font-semibold tabular-nums text-os-text">{ formatCurrency(deposit.totalAmount) }</span>
			</div>

			<div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-os-text-muted">
				<span>{ deposit.depositCode }</span>
				<span aria-hidden>·</span>
				<span>{ PAYMENT_METHOD_TAGS[deposit.paymentMethod].name }</span>
				<span aria-hidden>·</span>
				<span>{ formatInstantDate(deposit.receivedAt) }</span>

				{ !deposit.belongsHere && (
					<TagBadge label={ foreignLabel } color="purple" size="sm"/>
				) }

				{ deposit.overpaid && (
					<TagBadge label="nadpłacono" color="amber" size="sm"/>
				) }
			</div>

			{/* Shown when some of the deposit's money did not stay on this sheet (Even if the deposit is from another month) */ }
			{ settledHere !== deposit.totalAmount && (
				<div className="border-t border-os-border/60 pt-1 mt-2.5">
					<MoneyLine label="Rozliczone na tej liście:" amount={ settledHere }/>
					<MoneyLine label="Rozliczone na innych listach:" amount={ deposit.spentElsewhere }/>
					<MoneyLine label="Pozostało jako nadpłata:" amount={ deposit.unallocated }/>
				</div>
			) }
		</li>
	);
}
