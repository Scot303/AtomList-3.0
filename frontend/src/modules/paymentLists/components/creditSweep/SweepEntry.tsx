import { formatInstantDate } from '@/utils/dateUtils.ts';
import { formatCurrency } from '@/lib/locale';
import { DepositPlanTable } from '@/modules/deposits/components/DepositPlanTable';
import { PAYMENT_METHOD_NAMES } from '@/types/finance.ts';
import type { CreditSweepEntryView } from '../../types/types.ts';


/**
 * One handover: whose money it is, and which charges it would clear.
 */
export function SweepEntry({ entry }: { entry: CreditSweepEntryView }) {
	return (
		<article className="space-y-2 border-b border-os-border pb-3">
			<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-os-text-muted">
					<span>{ entry.depositCode }</span>
					<span aria-hidden>·</span>
					<span>{ PAYMENT_METHOD_NAMES[entry.paymentMethod] }</span>
					<span aria-hidden>·</span>
					<span>{ formatInstantDate(entry.receivedAt) }</span>
				</div>

				<span className="text-sm tabular-nums text-os-text-muted">
					Wolne środki: <span className="font-bold text-os-text">{ formatCurrency(entry.creditAvailable) }</span>
				</span>
			</div>


			<DepositPlanTable settlements={ entry.settlements }/>

			{ entry.remainingCredit > 0 && (
				<p className="text-sm text-os-text-muted px-1 mt-3">
					Po zatwierdzeniu zostanie { formatCurrency(entry.remainingCredit) } wolnych środków na wpłacie.
				</p>
			) }
		</article>
	);
}
