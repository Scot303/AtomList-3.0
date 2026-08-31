import { Calculator } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { fieldMessageReserve } from '@/components/ui/fields';
import { cn } from '@/lib/cn';
import { useModalStore } from '@/stores/modalStore';
import { DepositFormFields } from '../components/deposit/DepositFormFields';
import { DepositPlanReview } from '../components/deposit/DepositPlanReview';
import { useDepositPlanForm } from '../hooks/ui/useDepositPlanForm.ts';
import { describeList, isCustomList } from '../types/listLabels';
import type { PaymentListView } from '../types/types.ts';


interface DepositModalProps {
	list: PaymentListView;
	/** Who the money is for, when the caller already knows. */
	defaultPersonIds?: string[];
}


/**
 * Money handed over at the counter, in two steps: work out what it would settle, then confirm that.
 */
export default function DepositModal({ list, defaultPersonIds }: DepositModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const deposit = useDepositPlanForm({ list, defaultPersonIds });

	const { current, busy, form } = deposit;

	const { control } = form;

	return (
		<div className="mt-2">
			{ isCustomList(list) ? (
				<Alert tone="info" title="Ta lista nie jest listą miesięczną">
					Pozycje z tej listy najlepiej jest rozliczać pojedynczo, poprzez opcję „Rozlicz” w menu kontekstowym wiersza.
				</Alert>
			) : (
				<p className="text-base text-os-text-muted">
					Wpłata na listę <span className="font-bold text-os-primary">{ describeList(list) }</span>.
				</p>
			) }

			<form onSubmit={ deposit.runPlan } noValidate className="space-y-5 mt-8">
				<div className={ cn('space-y-2', fieldMessageReserve) }>
					<DepositFormFields control={ control } busy={ busy }/>
				</div>

				{ deposit.planError !== null && <Alert tone="danger">{ deposit.planError }</Alert> }

				{ deposit.stale && (
					<Alert tone="warning">Dane wpłaty się zmieniły. Wylicz rozliczenie ponownie, żeby je zatwierdzić.</Alert>
				) }

				{ current === null && (
					<div className="flex justify-end gap-3 pt-1">
						<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
							Anuluj
						</Button>

						<Button type="submit" size="md" isLoading={ deposit.planning } leftIcon={ <Calculator size={ 16 }/> }>
							Wylicz
						</Button>
					</div>
				) }
			</form>

			{ current !== null && (
				<DepositPlanReview
					plan={ current }
					personIds={ form.getValues('personIds') }
					busy={ busy }
					replanning={ deposit.planning }
					error={ deposit.saveError }
					onReplan={ () => void deposit.runPlan() }
					onConfirm={ () => void deposit.confirm() }
					onCancel={ closeModal }
				/>
			) }
		</div>
	);
}
