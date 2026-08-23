import { Eye, Trash2 } from 'lucide-react';
import { notifyApiError, notifySuccess } from '@/lib/toast.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { useConfirm } from '@/stores/dialogStore.ts';
import type { ContextMenuItem } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry.ts';
import { useModalStore } from '@/stores/modalStore.ts';
import { useDeletePaymentList } from '../usePaymentListMutations.ts';
import { describeList } from '../../types/listLabels.ts';
import type { PaymentListView } from '../../types/types.ts';
import { usePrefetchGroups } from "@/modules/groups/hooks/useGroups.ts";
import { usePrefetchPersons } from "@/modules/persons/hooks/usePersons.ts";


export type CustomListMenuBuilder = (list: PaymentListView) => ContextMenuItem[];


export function useCustomListMenu(): CustomListMenuBuilder {
	const { hasPermission } = useAuth();

	const openModal = useModalStore((state) => state.openModal);
	const confirm = useConfirm();

	const { mutate: deleteList } = useDeletePaymentList();

	const prefetchGroups = usePrefetchGroups();
	const prefetchPersons = usePrefetchPersons();

	const canModify = hasPermission('MODIFY_LISTS');

	const requestDelete = async (list: PaymentListView) => {
		const confirmed = await confirm({
			title: 'Usunąć listę?',
			message: `Lista ${ describeList(list) } zniknie razem ze wszystkimi swoimi pozycjami. Jeśli zapisano na niej `
				+ 'jakiekolwiek pieniądze, usunięcie zostanie odrzucone.',
			confirmText: 'Usuń listę',
			variant: 'danger',
		});

		if (!confirmed) {
			return;
		}

		deleteList(list.id, {
			onSuccess: () => notifySuccess('Lista została usunięta.'),
			onError: notifyApiError,
		});
	};

	return (list: PaymentListView) => {
		preloadModal('lists.customForm');
		prefetchGroups();
		prefetchPersons();

		return [
			{
				id: 'details',
				label: 'Szczegóły',
				icon: Eye,
				onSelect: () => void openModal('lists.customForm', { list }),
			},
			{
				id: 'delete',
				label: 'Usuń',
				icon: Trash2,
				danger: true,
				separatorBefore: true,
				disabled: !canModify || list.closed,
				onSelect: () => void requestDelete(list),
			},
		];
	};
}
