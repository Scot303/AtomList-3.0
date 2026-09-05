import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { ScopeTotals } from '@/components/shared/ScopeTotals.tsx';
import { pluralise } from '@/lib/locale';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useModalStore } from '@/stores/modalStore';
import type { ScopeSplit } from '@/types/finance.ts';
import type { OutstandingPaymentView } from '../../types/types.ts';
import { usePersonArrears } from '../../hooks/queries/usePersonArrears.ts';
import { PersonArrearsTable } from './PersonArrearsTable.tsx';


interface PersonArrearsSectionProps {
	personId: string;
	personName: string;
}


/**
 * Everything this person has not finished paying, whichever month it was billed in.
 */
export function PersonArrearsSection({ personId, personName }: PersonArrearsSectionProps) {
	const { hasPermission } = useAuth();
	const closeModal = useModalStore((state) => state.closeModal);

	const arrears = usePersonArrears(personId);

	return (
		<section className="space-y-4">
			<h3 className="px-1 text-base font-bold tracking-wide text-os-primary uppercase">Zalegające opłaty</h3>

			{ arrears.isPending ? (
				<div className="flex justify-center py-10">
					<Spinner/>
				</div>
			) : arrears.isError ? (
				<Alert tone="danger">{ arrears.error.message }</Alert>
			) : arrears.data.payments.length === 0 ? (
				<Alert tone="success" contentClassName="text-sm">
					{ personName } nie ma żadnych zaległych opłat.
				</Alert>
			) : (
				<div className="space-y-3">
					<p className="px-1 text-sm text-os-text-muted">
						W systemie znaleziono{ ' ' }
						<span className="font-semibold text-os-error">
							{ arrears.data.payments.length } { pluralise(arrears.data.payments.length, 'nieopłaconą pozycję', 'nieopłacone pozycje', 'nieopłaconych pozycji') }
						</span>.
					</p>

					<PersonArrearsTable
						payments={ arrears.data.payments }
						linkLists={ hasPermission('MODIFY_PAYMENTS') }
						onNavigate={ closeModal }
					/>

					<ArrearsTotals payments={ arrears.data.payments }/>
				</div>
			) }
		</section>
	);
}


function ArrearsTotals({ payments }: { payments: OutstandingPaymentView[] }) {
	const priced = arrearsTotals(payments);

	return (
		<ScopeTotals
			gross={ { open: priced.open.gross, tournament: priced.tournament.gross, total: priced.total.gross } }
			priced={ priced }
			title="Suma zaległych opłat"
			className="ml-auto w-full max-w-80 sm:w-80"
		/>
	);
}


function arrearsTotals(payments: OutstandingPaymentView[]): ScopeSplit {
	const totals: ScopeSplit = {
		open: { gross: 0, discount: 0, net: 0 },
		tournament: { gross: 0, discount: 0, net: 0 },
		total: { gross: 0, discount: 0, net: 0 },
	};

	for (const payment of payments) {
		const scope = payment.tournamentList ? totals.tournament : totals.open;
		const remaining = payment.amountToPay - payment.amountSettled;

		scope.gross += remaining;
		scope.net += remaining;
		totals.total.gross += remaining;
		totals.total.net += remaining;
	}

	return totals;
}
