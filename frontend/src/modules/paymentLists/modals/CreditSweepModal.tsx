import { Check } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { formatCurrency, pluralise } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { SweepEntry } from '../components/creditSweep/SweepEntry';
import { SweepTotals } from '../components/creditSweep/SweepTotals';
import { useCreditSweep, useSettleOverpayments } from '../hooks/useCreditSweep';
import { describeList } from '../types/listLabels';
import type { CreditSweepResultView, CreditSweepView, PaymentListView } from '../types/types.ts';


interface CreditSweepModalProps {
	list: PaymentListView;
}


/**
 * Everybody's leftover credit, spent on this list in one confirmed step.
 */
export default function CreditSweepModal({ list }: CreditSweepModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const sweep = useCreditSweep(list.id);

	if (sweep.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (sweep.isError) {
		return <Alert tone="danger">{ sweep.error.message }</Alert>;
	}

	return <Sweep list={ list } sweep={ sweep.data } onClose={ closeModal }/>;
}


interface SweepProps {
	list: PaymentListView;
	sweep: CreditSweepView;
	onClose: () => void;
}


function Sweep({ list, sweep, onClose }: SweepProps) {
	const settle = useSettleOverpayments();

	const confirm = () => {
		settle.mutate(
			{
				listId: list.id,
				payload: {
					// Echoing the plan back is what makes the server refuse to settle anything else.
					expected: sweep.entries.flatMap((entry) => entry.settlements.map((line) => ( {
						depositId: entry.depositId,
						paymentId: line.paymentId,
						amount: line.amount,
					} ))),
				},
			},
			{
				onSuccess: (result) => {
					notifySuccess(describeOutcome(result));
					onClose();
				},
			},
		);
	};

	if (sweep.entries.length === 0) {
		return (
			<div className="mt-2 space-y-5">
				<Alert tone="info" title="Nie ma nadpłat do rozliczenia">
					Nikt z listy { describeList(list) } nie ma nadpłaty, którą można by tu wykorzystać.
				</Alert>

				<div className="flex justify-end pt-1">
					<Button type="button" variant="secondary_muted" size="md" onClick={ onClose }>
						Zamknij
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mt-2 space-y-5">
			<p className="text-base text-os-text-muted">
				Na liście <span className="font-bold text-os-primary">{ describeList(list) }</span> do wykorzystania są{ ' ' }
				{ pluralise(sweep.depositCount, 'nadpłata', 'nadpłaty', 'nadpłaty') } z <span className="font-bold text-os-primary">{ sweep.depositCount }</span>{ ' ' }
				{ pluralise(sweep.depositCount, 'wpłaty', 'wpłat', 'wpłat') }.
			</p>

			{ list.closed && (
				<Alert tone="warning" title="Lista jest zamknięta">
					Długi zostaną zamknięte, ale pieniądze będą się liczyć jako przychód miesiąca, w którym wpłynęły.
				</Alert>
			) }

			<section className="space-y-5 mt-10">
				{ sweep.entries.map((entry) => <SweepEntry key={ entry.depositId } entry={ entry }/>) }
			</section>

			<SweepTotals sweep={ sweep }/>

			{ settle.error !== null && <Alert tone="danger">{ settle.error.message }</Alert> }

			<div className="flex flex-wrap justify-end gap-3 pt-5">
				<Button type="button" variant="secondary_muted" size="md" disabled={ settle.isPending } onClick={ onClose }>
					Anuluj
				</Button>

				<Button
					type="button"
					size="md"
					isLoading={ settle.isPending }
					onClick={ confirm }
					leftIcon={ <Check size={ 16 }/> }
				>
					Rozlicz nadpłaty
				</Button>
			</div>
		</div>
	);
}


/**
 * What the toast says once the credit is spent, since the plan is about to disappear off screen.
 */
function describeOutcome(result: CreditSweepResultView): string {
	const settled = `Rozliczono ${ formatCurrency(result.allocatedTotal) } z nadpłat, zamykając `
		+ `${ result.paymentCount } ${ pluralise(result.paymentCount, 'pozycję', 'pozycje', 'pozycji') }`;

	return result.remainingCreditTotal > 0
		? `${ settled }; ${ formatCurrency(result.remainingCreditTotal) } zostało jako nadpłata.`
		: `${ settled }.`;
}
