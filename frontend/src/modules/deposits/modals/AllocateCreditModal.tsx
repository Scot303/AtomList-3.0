import { Calculator } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { LinePanel, MoneyLine, TextLine } from '@/components/shared/MoneyLines.tsx';
import { Button } from '@/components/ui/buttons/Button';
import { fieldMessageReserve } from '@/components/ui/fields';
import { cn } from '@/lib/cn';
import { useModalStore } from '@/stores/modalStore';
import { coveredPersonsNames } from '@/types/finance.ts';
import { CreditAllocationFields } from '../components/allocateCredit/CreditAllocationFields';
import { CreditPlanReview } from '../components/allocateCredit/CreditPlanReview';
import { useAllocateCreditPlanForm } from '../hooks/ui/useAllocateCreditPlanForm';
import type { DepositView } from '../types/types.ts';


interface AllocateCreditModalProps {
	deposit: DepositView;
}


/** Spends a deposit's remaining credit after the user reviews a fresh allocation plan. */
export default function AllocateCreditModal({ deposit }: AllocateCreditModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const allocation = useAllocateCreditPlanForm(deposit);

	const { current, busy, form } = allocation;
	const { control } = form;

	if (deposit.unallocatedAmount <= 0) {
		return (
			<div className="mt-2 space-y-5">
				<Alert tone="info" contentClassName="text-sm">Na wpłacie { deposit.code } nie ma już wolnych środków do rozliczenia.</Alert>

				<div className="flex justify-end pt-1">
					<Button type="button" variant="secondary_muted" size="md" onClick={ closeModal }>
						Zamknij
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mt-2 space-y-5">
			<LinePanel title="Szczegóły nadpłaty">
				<MoneyLine label="Wolne środki:" amount={ deposit.unallocatedAmount } tone="strong"/>
				<TextLine label="Za:">{ coveredPersonsNames(deposit.coveredPersons) }</TextLine>
				<TextLine label="Rozliczane na:">
					{ deposit.scope === 'TOURNAMENT' ? 'Listach turniejowych' : 'Listach OPEN' }
				</TextLine>
			</LinePanel>

			<form onSubmit={ allocation.runPlan } noValidate className="space-y-5">
				<div className={ cn('space-y-2', fieldMessageReserve) }>
					<CreditAllocationFields control={ control } coveredPersons={ deposit.coveredPersons } busy={ busy }/>
				</div>

				{ allocation.planError !== null && <Alert tone="danger">{ allocation.planError }</Alert> }

				{ allocation.stale && <Alert tone="info" contentClassName="text-sm">Dane się zmieniły. Wylicz rozliczenie ponownie, żeby je zatwierdzić.</Alert> }

				{ current === null && (
					<div className="flex justify-end gap-3 pt-1">
						<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
							Anuluj
						</Button>

						<Button type="submit" size="md" isLoading={ allocation.planning } leftIcon={ <Calculator size={ 16 }/> }>
							Wylicz
						</Button>
					</div>
				) }
			</form>

			{ current !== null && (
				<CreditPlanReview
					plan={ current }
					busy={ busy }
					replanning={ allocation.planning }
					error={ allocation.saveError }
					onReplan={ () => void allocation.runPlan() }
					onConfirm={ () => void allocation.confirm() }
					onCancel={ closeModal }
				/>
			) }
		</div>
	);
}
