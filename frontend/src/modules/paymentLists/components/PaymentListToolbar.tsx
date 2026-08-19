import { Calculator, ChevronDown, Coins, FileText, Lock, LockOpen, Plus, RefreshCw, Trash2, UserPlus, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/buttons/ActionMenu';
import { Button } from '@/components/ui/buttons/Button';
import { usePopover } from '@/hooks/usePopover';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import { notifyApiError, notifySuccess } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { paths } from '@/routes/paths';
import { useConfirm } from '@/stores/dialogStore';
import { useModalStore } from '@/stores/modalStore';
import { useCreditSweep } from '../hooks/useCreditSweep';
import { useCloseList, useDeletePaymentList, useRecalculateList, useReopenList, useRepopulateList, } from '../hooks/usePaymentListMutations';
import { describeList, isCustomList } from '../types/listLabels';
import type { PaymentListView } from '../types/types.ts';


interface PaymentListToolbarProps {
	list: PaymentListView;
}


export function PaymentListToolbar({ list }: PaymentListToolbarProps) {
	const navigate = useNavigate();
	const popover = usePopover({ width: 'auto', align: 'start' });
	const { open, setReference, getReferenceProps } = popover;

	const { hasPermission } = useAuth();
	const openModal = useModalStore((state) => state.openModal);
	const confirm = useConfirm();

	const recalculate = useRecalculateList();
	const repopulate = useRepopulateList();
	const closeList = useCloseList();
	const reopenList = useReopenList();
	const deleteList = useDeletePaymentList();

	/**
	 * Read here rather than only inside the dialog, so the amount waiting can sit in the menu item's own label.
	 */
	const sweep = useCreditSweep(list.id);
	const creditWaiting = sweep.data?.allocatedTotal ?? 0;

	const canModifyPayments = hasPermission('MODIFY_PAYMENTS');
	const canModifyLists = hasPermission('MODIFY_LISTS');
	const canCloseLists = hasPermission('CLOSE_LISTS');
	const canReadReport = hasPermission('READ_LISTS') && hasPermission('READ_PAYMENTS');

	const closed = list.closed;
	const listName = describeList(list);

	const busy = recalculate.isPending
		|| repopulate.isPending
		|| closeList.isPending
		|| reopenList.isPending
		|| deleteList.isPending;

	const handleRecalculate = async () => {
		const confirmed = await confirm({
			title: 'Przeliczyć listę ponownie?',
			message: 'Kwoty zostaną naliczone od nowa z aktualnych zapisów do grup i zniżek. \n\nRęcznie dodane opłaty '
				+ 'i zapisane obecności pozostaną bez zmian, ale zmienione stawki grup nadpiszą to, co jest obecnie na liście.',
			confirmText: 'Przelicz',
			variant: 'warning',
		});

		if (confirmed) {
			recalculate.mutate(list.id, {
				onSuccess: () => notifySuccess('Lista została przeliczona.'),
				onError: notifyApiError,
			});
		}
	};

	const handleRepopulate = () => {
		repopulate.mutate(list.id, {
			onSuccess: () => notifySuccess('Skład listy został uzupełniony.'),
			onError: notifyApiError,
		});
	};

	const handleClose = async () => {
		const confirmed = await confirm({
			title: 'Zamknąć listę?',
			message: `Kwoty na liście ${ listName } zostaną zamrożone w celu przekazania do księgowości.\n\nPóźniejsze wpłaty `
				+ 'będą mogły zamknąć długi na tej liście, ale zostaną policzone jako przychód miesiąca, w którym zostaną dodane.',
			confirmText: 'Zamknij listę',
			variant: 'warning',
		});

		if (confirmed) {
			closeList.mutate(list.id, {
				onSuccess: () => notifySuccess('Lista została zamknięta.'),
				onError: notifyApiError,
			});
		}
	};

	const handleReopen = async () => {
		const confirmed = await confirm({
			title: 'Otworzyć listę ponownie?',
			message: `Lista ${ listName } była już przekazana do księgowości. Ponowne otwarcie pozwala zmieniać jej `
				+ 'kwoty, więc podsumowanie może przestać zgadzać się z tym, co zostało wysłane.',
			confirmText: 'Otwórz ponownie',
			variant: 'danger',
		});

		if (confirmed) {
			reopenList.mutate(list.id, {
				onSuccess: () => notifySuccess('Lista została ponownie otwarta.'),
				onError: notifyApiError,
			});
		}
	};

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: 'Usunąć listę?',
			message: `Lista ${ listName } zniknie razem ze wszystkimi swoimi płatnościami. \n\n`
				+ 'Jeśli zapisano na niej jakiekolwiek pieniądze, usunięcie zostanie odrzucone.',
			confirmText: 'Usuń listę',
			variant: 'danger',
		});

		if (confirmed) {
			deleteList.mutate(list.id, {
				onSuccess: () => {
					notifySuccess('Lista została usunięta.');
					void navigate(paths.paymentLists);
				},
				onError: notifyApiError,
			});
		}
	};

	const items: ActionMenuItem[] = [
		isCustomList(list)
			? {
				id: 'one-off',
				label: 'Dodaj opłatę jednorazową',
				icon: Plus,
				disabled: !canModifyPayments || closed || busy,
				onSelect: () => void openModal('payments.oneOff', { list }),
			}
			: {
				id: 'add-persons',
				label: 'Dodaj osoby',
				icon: UserPlus,
				disabled: !canModifyLists || closed || busy,
				onSelect: () => void openModal('lists.addPersons', { list }),
			},
	];

	if (isCustomList(list)) {
		items.push({
			id: 'repopulate',
			label: 'Uzupełnij skład',
			icon: RefreshCw,
			disabled: !canModifyLists || closed || busy || list.populationMode === 'BY_PERSONS',
			onSelect: handleRepopulate,
		});
	} else {
		items.push({
			id: 'recalculate',
			label: 'Przelicz listę',
			icon: Calculator,
			disabled: !canModifyLists || closed || busy,
			onSelect: () => void handleRecalculate(),
		});
	}

	items.push({
		id: 'overpayments',
		label: creditWaiting > 0 ? `Rozlicz nadpłaty (${ formatCurrency(creditWaiting) })` : 'Rozlicz nadpłaty',
		icon: Coins,
		separatorBefore: true,
		disabled: !canModifyPayments || busy || creditWaiting <= 0,
		onSelect: () => void openModal('lists.overpayments', { list }),
	});

	items.push({
		id: 'report',
		label: 'Podsumowanie listy',
		icon: FileText,
		separatorBefore: true,
		disabled: !canReadReport,
		onSelect: () => void openModal('lists.report', { listId: list.id }),
	});

	items.push(
		closed
			? {
				id: 'reopen',
				label: 'Otwórz ponownie',
				icon: LockOpen,
				separatorBefore: true,
				disabled: !canCloseLists || busy,
				onSelect: () => void handleReopen(),
			}
			: {
				id: 'close',
				label: 'Zamknij listę',
				icon: Lock,
				separatorBefore: true,
				disabled: !canCloseLists || busy,
				onSelect: () => void handleClose(),
			},
	);

	items.push({
		id: 'delete',
		label: 'Usuń listę',
		icon: Trash2,
		danger: true,
		disabled: !canModifyLists || closed || busy,
		onSelect: () => void handleDelete(),
	});

	return (
		<div className="ml-5 flex items-center gap-2">
			<div>
				<button
					ref={ setReference }
					type="button"
					aria-haspopup="true"
					aria-expanded={ open }
					{ ...getReferenceProps() }
					className={ cn(
						'flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-1.5 text-sm font-bold',
						'border-os-border-highlight bg-os-surface/25 text-os-text-muted shadow-md transition-all',
						'hover:bg-white/3',
						'focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none',
					) }
				>
					Akcje
					<ChevronDown size={ 14 } className={ cn('transition-transform duration-200', open && 'rotate-180') }/>
				</button>

				<ActionMenu state={ popover } items={ items } ariaLabel="Akcje listy"/>
			</div>

			<Button
				size="md"
				className="shrink-0 py-1.5"
				disabled={ !canModifyPayments }
				leftIcon={ <Wallet size={ 16 }/> }
				onClick={ () => void openModal('payments.deposit', { list }) }
			>
				Wpłata
			</Button>
		</div>
	);
}
