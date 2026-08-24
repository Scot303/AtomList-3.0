import { pluralise } from '@/lib/locale';
import { LinePanel, MoneyLine } from '@/components/shared/MoneyLines.tsx';
import type { CreditSweepView } from '../../types/types.ts';


/**
 * The whole sweep in three figures: what is available, what it clears, and what is left waiting.
 */
export function SweepTotals({ sweep }: { sweep: CreditSweepView }) {
	return (
		<>
			<LinePanel>
				<MoneyLine label="Wszystkie wolne środki brane pod uwagę:" amount={ sweep.creditAvailableTotal } tone="strong"/>
				<MoneyLine
					label="Wolne środki, które zostaną rozliczone:"
					amount={ sweep.allocatedTotal }
					tone="good"
					suffix={
						<span className="ml-1 text-os-text-muted">
							({ sweep.paymentCount } { pluralise(sweep.paymentCount, 'pozycja', 'pozycje', 'pozycji') })
						</span>
					}
				/>
				<MoneyLine
					label="Pozostanie w systemie jako nadpłata:"
					amount={ sweep.remainingCreditTotal }
					tone={ sweep.remainingCreditTotal > 0 ? 'good' : 'muted' }
					separated
				/>
			</LinePanel>
		</>
	);
}
