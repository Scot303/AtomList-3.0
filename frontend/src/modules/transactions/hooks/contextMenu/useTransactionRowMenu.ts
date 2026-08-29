import { Eye, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/locale.ts';
import { notifyApiError, notifySuccess } from '@/lib/toast.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import type { PaymentListView } from '@/modules/paymentLists/types/types.ts';
import { useConfirm } from '@/stores/dialogStore.ts';
import type { ContextMenuItem } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry.ts';
import { useModalStore } from '@/stores/modalStore.ts';
import { useDeleteTransaction } from '../mutations/useTransactionMutations.ts';
import { INCOME_ID, type TransactionRow } from '../../types/transactionRows.ts';


export type TransactionRowMenuBuilder = (row: TransactionRow) => ContextMenuItem[];


export function useTransactionRowMenu(list: PaymentListView): TransactionRowMenuBuilder {
	const { hasPermission } = useAuth();

	const openModal = useModalStore((state) => state.openModal);
	const confirm = useConfirm();

	const { mutate: deleteTransaction } = useDeleteTransaction();

	const canModifyIncome = hasPermission('MODIFY_INCOME_TRANSACTIONS');
	const canModifyExpense = hasPermission('MODIFY_EXPENSE_TRANSACTIONS');

	const requestDelete = async (row: TransactionRow) => {
		const confirmed = await confirm({
			title: 'Usunąć tą pozycję?',
			message: `Pozycja „${ row.name }” na kwotę ${ formatCurrency(row.total) } zniknie z listy.`,
			confirmText: 'Usuń',
			variant: 'danger',
		});

		if (!confirmed) {
			return;
		}

		deleteTransaction(
			{ id: row.id, listId: list.id },
			{
				onSuccess: () => notifySuccess('Pozycja została usunięta.'),
				onError: notifyApiError,
			},
		);
	};

	return (row: TransactionRow) => {
		preloadModal('transactions.details');

		const editable = ( row.type === INCOME_ID ? canModifyIncome : canModifyExpense ) && !list.closed;

		return [
			{
				id: 'details',
				label: 'Szczegóły',
				icon: Eye,
				onSelect: () => void openModal('transactions.details', {
					listId: list.id,
					transactionId: row.id,
					listClosed: list.closed,
				}),
			},
			{
				id: 'delete',
				label: 'Usuń pozycję',
				icon: Trash2,
				danger: true,
				separatorBefore: true,
				disabled: !editable,
				onSelect: () => void requestDelete(row),
			},
		];
	};
}
