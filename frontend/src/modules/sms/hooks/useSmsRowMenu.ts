import { Eye, Send } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { usePrefetchGroups } from '@/modules/groups/hooks/useGroups';
import { usePrefetchPersons } from '@/modules/persons/hooks/usePersons';
import type { ContextMenuItem } from '@/stores/menuStore';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import type { SmsRow } from '../types/smsRows.ts';


export type SmsRowMenuBuilder = (row: SmsRow) => ContextMenuItem[];


export function useSmsRowMenu(): SmsRowMenuBuilder {
	const { hasPermission } = useAuth();

	const openModal = useModalStore((state) => state.openModal);

	const prefetchPersons = usePrefetchPersons();
	const prefetchGroups = usePrefetchGroups();

	const canSend = hasPermission('SEND_SMS');

	return (row: SmsRow) => {
		preloadModal('sms.details');
		preloadModal('sms.send');

		prefetchPersons();
		prefetchGroups();

		return [
			{
				id: 'details',
				label: 'Szczegóły',
				icon: Eye,
				onSelect: () => void openModal('sms.details', { sms: row.sms })
			},
			{
				id: 'resend',
				label: 'Wyślij ponownie tę treść',
				icon: Send,
				separatorBefore: true,
				disabled: !canSend,
				onSelect: () => void openModal('sms.send', { message: row.message })
			},
		];
	};
}
