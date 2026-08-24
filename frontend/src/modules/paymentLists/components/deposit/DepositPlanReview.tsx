import { Check } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { formatCurrency, pluralise } from '@/lib/locale';
import { DepositPlanTable } from '@/modules/deposits/components/DepositPlanTable';
import { usePersons } from '@/modules/persons/hooks/usePersons';
import { LinePanel, MoneyLine } from '@/components/shared/MoneyLines.tsx';
import type { DepositPlanView } from '@/modules/deposits/types/types.ts';


interface DepositPlanReviewProps {
	plan: DepositPlanView;
	personIds: string[];
	busy: boolean;
	replanning: boolean;
	error: string | null;
	onReplan: () => void;
	onConfirm: () => void;
	onCancel: () => void;
}


/**
 * What the money would settle, for approval.
 */
export function DepositPlanReview({ plan, personIds, busy, replanning, error, onReplan, onConfirm, onCancel }: DepositPlanReviewProps) {
	const persons = usePersons();
	const settlesNothing = plan.settlements.length === 0;

	const byId = new Map(( persons.data ?? [] ).map((person) => [person.id, `${ person.name } ${ person.lastName }`]));
	const names = personIds.map((id) => byId.get(id)).filter((name) => name !== undefined).join(', ');
	const coveredNames = names === '' ? 'wybranych osób' : names;

	return (
		<section className="space-y-4 border-t border-os-border/70 pt-5">
			<h3 className="text-base font-bold tracking-wide text-os-primary uppercase">Co zostanie rozliczone</h3>

			{ settlesNothing ? (
				<Alert tone="warning" title="Nie ma czego rozliczyć" contentClassName="text-sm">
					Te osoby nie mają zaległości. Cała kwota zostanie zapisana jako nadpłata i będzie czekać na kolejne listy.
				</Alert>
			) : (
				<DepositPlanTable settlements={ plan.settlements }/>
			) }

			<LinePanel>
				<MoneyLine label="Przyjęta kwota wpłaty:" amount={ plan.totalAmount } tone="strong"/>
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

			{ plan.unallocatedAmount > 0 && !settlesNothing && (
				<Alert tone="info" contentClassName="text-sm">
					{ formatCurrency(plan.unallocatedAmount) } zostanie jako nadpłata do wykorzystania dla: { coveredNames }.<br/>
					Można ją później wykorzystać, na tym samym rodzaju listy, poprzez „Rozlicz → Z poprzednich wpłat” lub poprzez opcję „Rozlicz nadpłaty” dostępną w menu akcji na liście.
				</Alert>
			) }

			{ plan.coversEverythingOwed && !settlesNothing && (
				<Alert tone="success" contentClassName="text-sm">Po tej wpłacie, wybrane osoby nie będą już nic zalegać.</Alert>
			) }

			{ error !== null && (
				<Alert
					tone="danger"
					contentClassName="text-sm"
					action={
						<Button type="button" variant="secondary" size="sm" isLoading={ replanning } onClick={ onReplan }>
							Wylicz ponownie
						</Button>
					}
				>
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
					disabled={ busy }
					isLoading={ busy && !replanning }
					onClick={ onConfirm }
					leftIcon={ <Check size={ 16 }/> }
				>
					Zatwierdź wpłatę
				</Button>
			</div>
		</section>
	);
}
