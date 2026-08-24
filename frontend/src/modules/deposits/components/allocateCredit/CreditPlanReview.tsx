import { Check } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { LinePanel, MoneyLine } from '@/components/shared/MoneyLines.tsx';
import { pluralise } from '@/lib/locale';
import { DepositPlanTable } from '../DepositPlanTable';
import type { DepositPlanView } from '../../types/types.ts';


interface CreditPlanReviewProps {
	plan: DepositPlanView;
	busy: boolean;
	replanning: boolean;
	error: string | null;
	onReplan: () => void;
	onConfirm: () => void;
	onCancel: () => void;
}


/**
 * What the leftover credit would settle, for approval.
 */
export function CreditPlanReview({ plan, busy, replanning, error, onReplan, onConfirm, onCancel }: CreditPlanReviewProps) {
	const settlesNothing = plan.settlements.length === 0;

	return (
		<section className="space-y-4 border-t border-os-border/70 pt-5">
			<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Co zostanie rozliczone</h3>

			{ settlesNothing ? (
				<Alert tone="warning" title="Nie ma czego rozliczyć" contentClassName="text-sm">
					Te osoby nie mają obecnie zaległości, do których ta wpłata mogłaby trafić.
				</Alert>
			) : (
				<DepositPlanTable settlements={ plan.settlements }/>
			) }

			<LinePanel>
				<MoneyLine label="Dostępne środki:" amount={ plan.totalAmount } tone="strong"/>
				<MoneyLine
					label="Rozliczona kwota na dostępnych pozycjach:"
					amount={ plan.allocatedAmount }
					tone="good"
					suffix={
						<span className="ml-1 text-os-text-muted">
							({ plan.settlements.length } { pluralise(plan.settlements.length, 'pozycja', 'pozycje', 'pozycji') })
						</span>
					}
				/>
				<MoneyLine
					label="Pozostanie w systemie jako nadpłata:"
					amount={ plan.unallocatedAmount }
					tone={ plan.unallocatedAmount > 0 ? 'good' : 'muted' }
					separated
				/>
			</LinePanel>

			{ plan.nextMonthNotBilled && plan.unallocatedAmount > 0 && (
				<Alert tone="warning" contentClassName="text-sm">
					Kolejny miesiąc nie ma jeszcze dostępnej listy, więc opłacenie z góry jest w tym momencie nie możliwe.
				</Alert>
			) }

			{ error !== null && (
				<Alert tone="danger" contentClassName="text-sm">
					{ error }
				</Alert>
			) }

			<div className="flex flex-wrap justify-end gap-3 mt-8">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ onCancel }>
					Anuluj
				</Button>

				<Button type="button" variant="secondary" size="md" isLoading={ replanning } onClick={ onReplan }>
					Wylicz ponownie
				</Button>

				<Button
					type="button"
					size="md"
					disabled={ busy || settlesNothing }
					isLoading={ busy && !replanning }
					onClick={ onConfirm }
					leftIcon={ <Check size={ 16 }/> }
				>
					Rozlicz nadpłatę
				</Button>
			</div>
		</section>
	);
}
