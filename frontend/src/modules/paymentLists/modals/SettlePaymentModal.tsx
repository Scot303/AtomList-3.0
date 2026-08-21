import { useState } from 'react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { TagBadge, TagBadgeSingle } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { usePersonCredit } from '@/modules/deposits/hooks/usePersonCredit';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows';
import { FreshHandoverForm } from '../components/settlePayment/FreshHandoverForm';
import { type SettleMode, SettleModeSwitch } from '../components/settlePayment/SettleModeSwitch';
import { SpendCreditForm } from '../components/settlePayment/SpendCreditForm';
import { maySettleOnList } from '../types/depositScope';
import { CHARGE_KIND_OPTIONS } from '../types/paymentRows';
import type { PaymentListView, PaymentView } from '../types/types.ts';


interface SettlePaymentModalProps {
	payment: PaymentView;
	list: PaymentListView;
}


export default function SettlePaymentModal({ payment, list }: SettlePaymentModalProps) {
	const [mode, setMode] = useState<SettleMode>('fresh');

	const credit = usePersonCredit(payment.personId);
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);
	const group = payment.groupId === null ? undefined : groupsById.get(payment.groupId);

	const spendable = ( credit.data ?? [] )
		.filter((deposit) => deposit.unallocatedAmount > 0 && maySettleOnList(deposit, list));

	return (
		<div className="mt-2 space-y-5">
			<header className="space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="text-base font-bold text-os-text">{ payment.personName }</p>
						<p className="truncate text-sm text-os-text-muted ml-0.5 mt-0.5">
							{ payment.code } · <TagBadgeSingle id={ payment.chargeKind } options={ CHARGE_KIND_OPTIONS } size="sm"/>
						</p>
					</div>

					{ group !== undefined ? <TagBadge label={ group.name } color={ resolveGroupColor(group) }/> : payment.description }
				</div>

				<p className="text-sm text-os-text border-b border-os-border pb-3">
					{ payment.outstanding === 0
						? 'Płatność w pełni rozliczona'
						: <>
							Do rozliczenia pozostało:{ ' ' }
							<strong className={ `tabular-nums ${ payment.outstanding > 0 ? 'text-os-error' : 'text-os-green' }` }>
								{ formatCurrency(payment.outstanding) }
							</strong>
							<span className="text-os-text-muted"> / { formatCurrency(payment.amountToPay) }</span>
						</>
					}
				</p>
			</header>

			{ list.closed && (
				<Alert tone="warning" title="Lista jest zamknięta">
					Wpłata zamknie ten dług, ale zostanie policzona jako przychód miesiąca, w którym wpłynęła.
				</Alert>
			) }

			{ credit.isPending ? (
				<div className="flex justify-center py-2">
					<Spinner/>
				</div>
			) : spendable.length > 0 ? (
				<SettleModeSwitch mode={ mode } onChange={ setMode } creditCount={ spendable.length }/>
			) : null }

			{ mode === 'credit' && spendable.length > 0 ? (
				<SpendCreditForm payment={ payment } deposits={ spendable }/>
			) : (
				<FreshHandoverForm payment={ payment }/>
			) }
		</div>
	);
}
