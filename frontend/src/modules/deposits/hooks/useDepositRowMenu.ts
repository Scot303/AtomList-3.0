import { Coins, Eye, Trash2, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/locale';
import { notifyApiError, notifySuccess } from '@/lib/toast';
import { coveredPersonLabel } from '@/types/finance.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { usePrefetchPersons } from '@/modules/persons/hooks/usePersons';
import { useConfirm } from '@/stores/dialogStore';
import type { ContextMenuItem } from '@/stores/menuStore';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { useDeleteDeposit } from './useDepositMutations';
import { usePrefetchPersonCredit } from './usePersonCredit';
import { usePrefetchDeposit } from './useDeposits';
import type { DepositRow } from '../types/depositRows.ts';


export type DepositRowMenuBuilder = (row: DepositRow) => ContextMenuItem[];


/**
 * What can be done to one handover.
 */
export function useDepositRowMenu(): DepositRowMenuBuilder {
	const { hasPermission } = useAuth();

	const openModal = useModalStore((state) => state.openModal);
	const confirm = useConfirm();

	const prefetchDeposit = usePrefetchDeposit();
	const prefetchPersonCredit = usePrefetchPersonCredit();
	const prefetchPersons = usePrefetchPersons();

	const { mutate: deleteDeposit } = useDeleteDeposit();

	const canModify = hasPermission('MODIFY_PAYMENTS');

	const requestDelete = async (row: DepositRow) => {
		const confirmed = await confirm({
			title: 'Usunąć tę wpłatę?',
			message: `Wpłata ${ row.code } na ${ formatCurrency(row.totalAmount) } za ${ row.coveredNames } zniknie z systemu. \n\n`
				+ 'Zaleca się wykonanie tej operacji tylko w przypadku, gdy wpłata została zapisana omyłkowo.',
			confirmText: 'Usuń',
			variant: 'danger',
		});

		if (!confirmed) {
			return;
		}

		deleteDeposit(row.id, {
			onSuccess: () => notifySuccess(`Wpłata ${ row.code } została usunięta.`),
			onError: notifyApiError,
		});
	};

	return (row: DepositRow) => {
		preloadModal('deposits.details');
		preloadModal('deposits.allocate');
		preloadModal('deposits.personCredit');

		const { deposit } = row;

		prefetchDeposit(deposit.id);

		if (deposit.unallocatedAmount > 0) {
			prefetchPersons();
		}

		deposit.coveredPersons.forEach((person) => prefetchPersonCredit(person.id));

		const items: ContextMenuItem[] = [
			{
				id: 'details',
				label: 'Szczegóły',
				icon: Eye,
				onSelect: () => void openModal('deposits.details', { depositId: deposit.id }),
			},
		];

		if (deposit.unallocatedAmount > 0) {
			items.push({
				id: 'allocate',
				label: `Rozlicz nadpłatę (${ formatCurrency(deposit.unallocatedAmount) })`,
				icon: Wallet,
				separatorBefore: true,
				disabled: !canModify,
				onSelect: () => void openModal('deposits.allocate', { deposit }),
			});
		}

		const covered = deposit.coveredPersons;

		covered.forEach((person, index) => {
			items.push({
				id: `person-credit-${ person.id }`,
				label: covered.length === 1 ? 'Nadpłaty tej osoby' : `Nadpłaty: ${ coveredPersonLabel(person) }`,
				icon: Coins,
				separatorBefore: index === 0 && deposit.unallocatedAmount <= 0,
				onSelect: () => void openModal('deposits.personCredit', {
					personId: person.id,
					personName: person.fullName,
				}),
			});
		});

		items.push({
			id: 'delete',
			label: 'Usuń wpłatę',
			icon: Trash2,
			danger: true,
			separatorBefore: true,
			disabled: !canModify || deposit.allocatedAmount > 0,
			onSelect: () => void requestDelete(row),
		});

		return items;
	};
}
