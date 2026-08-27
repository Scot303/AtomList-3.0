import { Eye, Hash, Pencil, StickyNote, Trash2, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/locale.ts';
import { notifyApiError, notifySuccess } from '@/lib/toast.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { usePrefetchPersonCredit } from '@/modules/deposits/hooks/queries/usePersonCredit.ts';
import { usePrefetchGroups } from '@/modules/groups/hooks/useGroups.ts';
import { useConfirm } from '@/stores/dialogStore.ts';
import type { ContextMenuItem } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry.ts';
import { useModalStore } from '@/stores/modalStore.ts';
import { useDeleteOneOffPayment } from '../usePaymentMutations.ts';
import { usePrefetchPayment } from '../usePayments.ts';
import { hasCountableQuantity, isMembershipDerived, type PaymentRow } from '../../types/paymentRows.ts';
import type { PaymentListView } from '../../types/types.ts';


export type PaymentRowMenuBuilder = (row: PaymentRow) => ContextMenuItem[];


export function usePaymentRowMenu(list: PaymentListView): PaymentRowMenuBuilder {
	const { hasPermission } = useAuth();
	const openModal = useModalStore((state) => state.openModal);
	const confirm = useConfirm();
	const prefetchPayment = usePrefetchPayment();
	const prefetchPersonCredit = usePrefetchPersonCredit();
	const prefetchGroups = usePrefetchGroups();

	const { mutate: deleteOneOff } = useDeleteOneOffPayment();

	const canModify = hasPermission('MODIFY_PAYMENTS');
	const chargeEditable = canModify && !list.closed;

	const requestDelete = async (row: PaymentRow) => {
		const confirmed = await confirm({
			title: 'Usunąć tą płatność?',
			message: `Płatność „${ row.label }” o kwocie ${ formatCurrency(row.amountToPay) } zniknie z listy ${ row.payment.personName }.`,
			confirmText: 'Usuń',
			variant: 'danger',
		});

		if (!confirmed) {
			return;
		}

		deleteOneOff(
			{ id: row.id, listId: list.id },
			{
				onSuccess: () => notifySuccess('Płatność została usunięta.'),
				onError: notifyApiError,
			},
		);
	};


	return (row: PaymentRow) => {
		preloadModal('payments.details');
		preloadModal('payments.settle');
		preloadModal('payments.quantity');
		preloadModal('payments.oneOff');
		preloadModal('payments.edit');

		const { payment } = row;
		const oneOff = !isMembershipDerived(payment.chargeKind);

		prefetchPayment(payment.id);

		if (payment.outstanding > 0) {
			prefetchPersonCredit(payment.personId);
		}

		if (oneOff && list.requiresGroup) {
			prefetchGroups();
		}

		const items: ContextMenuItem[] = [
			{
				id: 'details',
				label: 'Szczegóły',
				icon: Eye,
				onSelect: () => void openModal('payments.details', { paymentId: payment.id, list }),
			},
		];

		if (oneOff) {
			items.push({
				id: 'edit-one-off',
				label: 'Edytuj pozycję',
				icon: Pencil,
				disabled: !chargeEditable,
				onSelect: () => void openModal('payments.oneOff', { list, payment }),
			});
		}

		if (payment.outstanding > 0) {
			items.push({
				id: 'settle',
				label: 'Rozlicz',
				icon: Wallet,
				disabled: !canModify,
				separatorBefore: true,
				onSelect: () => void openModal('payments.settle', { payment, list }),
			});
		}

		if (hasCountableQuantity(payment.chargeKind)) {
			items.push({
				id: 'quantity',
				label: 'Ustaw ilość',
				icon: Hash,
				disabled: !chargeEditable,
				onSelect: () => void openModal('payments.quantity', { payment }),
			});
		}

		items.push({
			id: 'note',
			label: list.tracksContracts ? 'Notatka i umowa' : 'Notatka',
			icon: StickyNote,
			disabled: !chargeEditable,
			onSelect: () => void openModal('payments.edit', { payment, tracksContracts: list.tracksContracts }),
		});

		if (oneOff) {
			items.push({
				id: 'delete',
				label: 'Usuń pozycję',
				icon: Trash2,
				danger: true,
				separatorBefore: true,
				disabled: !chargeEditable || payment.amountSettled > 0,
				onSelect: () => void requestDelete(row),
			});
		}

		return items;
	};
}
