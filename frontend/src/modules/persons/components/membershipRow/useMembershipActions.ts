import type { MouseEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { notifyApiError, notifySuccess } from '@/lib/toast.ts';
import { useConfirm } from '@/stores/dialogStore.ts';
import { useContextMenu } from '@/stores/menuStore.ts';
import { useDeleteMembership, useLeaveMembership } from '../../hooks/useMemberships.ts';
import type { MembershipView } from '../../types/types.ts';
import { formatShortDate } from '../../utils/personFormat.ts';


interface MembershipActionsOptions {
	membership: MembershipView;
	personId: string;
	personName: string;
	canModify: boolean;
}

/**
 * Ending a membership and erasing one, both behind a confirmation.
 *
 * The two are kept apart on purpose: ending keeps the entry, and with it the reason a settled list charged
 * what it charged, while deleting takes that away.
 */
export function useMembershipActions({ membership, personId, personName, canModify }: MembershipActionsOptions) {
	const confirm = useConfirm();
	const openContextMenu = useContextMenu();

	const leave = useLeaveMembership(personId);
	const remove = useDeleteMembership(personId);

	const busy = leave.isPending || remove.isPending;

	const handleLeave = async (leftAt: string) => {
		const confirmed = await confirm({
			title: 'Zakończyć członkostwo?',
			message: `${ personName } przestanie należeć do grupy ${ membership.groupName } z dniem ${ formatShortDate(leftAt) }. Wpis pozostanie w historii, więc rozliczone listy nadal będą się zgadzać.`,
			confirmText: 'Zakończ',
			variant: 'warning',
		});

		if (confirmed) {
			leave.mutate({ id: membership.id, leftAt }, {
				onSuccess: () => notifySuccess('Członkostwo zostało zakończone.'),
				onError: notifyApiError,
			});
		}
	};

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: 'Usunąć wpis?',
			message: `Wpis o członkostwie ${ personName } w grupie ${ membership.groupName } zniknie bez śladu, razem z powodem, dla którego rozliczone listy naliczyły to, co naliczyły.`,
			confirmText: 'Usuń mimo to',
			variant: 'danger',
		});

		if (confirmed) {
			remove.mutate(membership.id, {
				onSuccess: () => notifySuccess('Wpis został usunięty.'),
				onError: notifyApiError,
			});
		}
	};

	const handleContextMenu = (event: MouseEvent) => {
		if (!canModify) {
			return;
		}

		openContextMenu(event, [
			{
				id: 'delete',
				label: 'Usuń wpis',
				icon: Trash2,
				danger: true,
				disabled: busy,
				onSelect: () => void handleDelete(),
			},
		]);
	};

	return { busy, handleLeave, handleContextMenu };
}
