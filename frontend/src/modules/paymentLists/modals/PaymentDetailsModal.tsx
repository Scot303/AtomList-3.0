import { Hash, Pencil, StickyNote, Wallet } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { TagBadge, TagBadgeSingle } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows';
import { useModalStore } from '@/stores/modalStore';
import { ChargeBreakdown } from '../components/paymentDetails/ChargeBreakdown';
import { SettlementList } from '../components/paymentDetails/SettlementList';
import { usePayment } from '../hooks/usePayments';
import { CHARGE_KIND_OPTIONS, hasCountableQuantity, isMembershipDerived } from '../types/paymentRows';
import type { PaymentListView, PaymentView } from '../types/types.ts';


interface PaymentDetailsModalProps {
	paymentId: string;
	list: PaymentListView;
}


export default function PaymentDetailsModal({ paymentId, list }: PaymentDetailsModalProps) {
	const payment = usePayment(paymentId);

	if (payment.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (payment.isError) {
		return <Alert tone="danger">{ payment.error.message }</Alert>;
	}

	return <Details payment={ payment.data } list={ list }/>;
}


function Details({ payment, list }: { payment: PaymentView; list: PaymentListView }) {
	const { hasPermission } = useAuth();
	const openModal = useModalStore((state) => state.openModal);
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);

	const canModify = hasPermission('MODIFY_PAYMENTS');

	const chargeEditable = canModify && !list.closed;

	const oneOff = !isMembershipDerived(payment.chargeKind);
	const settlements = payment.settlements ?? [];
	const group = payment.groupId === null ? undefined : groupsById.get(payment.groupId);

	return (
		<div className="mt-2 space-y-5">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-base font-bold text-os-text">{ payment.personName }</p>
					<p className="truncate text-sm text-os-text-muted ml-0.5 mt-0.5">
						{ payment.code } · <TagBadgeSingle id={ payment.chargeKind } options={ CHARGE_KIND_OPTIONS } size="sm"/>
					</p>
				</div>

				{ group !== undefined ? <TagBadge label={ group.name } color={ resolveGroupColor(group) }/> : payment.description }
			</header>

			<ChargeBreakdown payment={ payment }/>

			{ payment.note !== null && payment.note !== '' && (
				<section className="space-y-1">
					<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Notatka</h3>
					<p className="text-sm whitespace-pre-wrap ml-0.5 text-os-text">{ payment.note }</p>
				</section>
			) }

			<section className="space-y-2">
				<div className="flex items-baseline justify-between gap-3">
					<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Rozliczenia płatności:</h3>

					{ settlements.length > 1 && (
						<span className="text-sm text-os-text-muted mr-1">
							{ settlements.length } wpłaty na { formatCurrency(payment.amountSettled) }
						</span>
					) }
				</div>

				<SettlementList
					settlements={ settlements }
					personName={ payment.personName }
					canModify={ canModify }
				/>
			</section>

			<div className="flex flex-wrap justify-end gap-3 pt-5">
				{ chargeEditable && oneOff && (
					<Button
						type="button"
						variant="secondary"
						size="md"
						leftIcon={ <Pencil size={ 16 }/> }
						onClick={ () => void openModal('payments.oneOff', { list, payment }) }
					>
						Edytuj pozycję
					</Button>
				) }

				{ chargeEditable && hasCountableQuantity(payment.chargeKind) && (
					<Button
						type="button"
						variant="secondary"
						size="md"
						leftIcon={ <Hash size={ 16 }/> }
						onClick={ () => void openModal('payments.quantity', { payment }) }
					>
						Ustaw ilość
					</Button>
				) }

				{ chargeEditable && (
					<Button
						type="button"
						variant="secondary"
						size="md"
						leftIcon={ <StickyNote size={ 16 }/> }
						onClick={ () => void openModal('payments.edit', { payment, tracksContracts: list.tracksContracts }) }
					>
						Notatka
					</Button>
				) }

				{ canModify && payment.outstanding > 0 && (
					<Button
						type="button"
						size="md"
						leftIcon={ <Wallet size={ 16 }/> }
						onClick={ () => void openModal('payments.settle', { payment, list }) }
					>
						Rozlicz
					</Button>
				) }
			</div>
		</div>
	);
}
