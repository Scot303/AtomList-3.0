import { Send } from 'lucide-react';
import { LinePanel, TextLine } from '@/components/shared/MoneyLines.tsx';
import { Button } from '@/components/ui/buttons/Button';
import { TagBadgeOf } from '@/components/ui/tags';
import { pluralise } from '@/lib/locale';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { formatPhone } from '@/modules/persons/utils/personFormat';
import { useModalStore } from '@/stores/modalStore';
import { formatInstantDateTime } from '@/utils/dateUtils.ts';
import { RECIPIENT_KIND_TAGS, toRecipientKind } from '../types/smsRows.ts';
import type { SmsView } from '../types/types.ts';


interface SmsDetailsModalProps {
	sms: SmsView;
}


export default function SmsDetailsModal({ sms }: SmsDetailsModalProps) {
	const { hasPermission } = useAuth();
	const canSend = hasPermission('SEND_SMS');

	const openModal = useModalStore((state) => state.openModal);

	const kind = toRecipientKind(sms);

	return (
		<div className="mt-2 space-y-5">
			<section className="space-y-2">
				<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Treść wiadomości</h3>

				<p className="styled-card rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-os-text">
					{ sms.message }
				</p>
			</section>

			<LinePanel title="Odbiorca">
				<TextLine label="Do kogo:">{ sms.recipientName ?? 'Nieznany' }</TextLine>
				<TextLine label="Rodzaj:">
					<TagBadgeOf tag={ RECIPIENT_KIND_TAGS[kind] }/>
				</TextLine>
				<TextLine label="Numer telefonu:">
					<span className="tabular-nums">{ formatPhone(sms.sentToPhone) }</span>
				</TextLine>
			</LinePanel>

			<LinePanel title="Wysyłka">
				<TextLine label="Data i godzina:">{ formatInstantDateTime(sms.createdAt) }</TextLine>
				<TextLine label="Długość treści:">
					{ sms.message.length } { pluralise(sms.message.length, 'znak', 'znaki', 'znaków') }
				</TextLine>
				<TextLine label="Naliczone części SMS:">
					{ sms.segments } { pluralise(sms.segments, 'część', 'części', 'części') }
				</TextLine>
			</LinePanel>

			{ canSend && (
				<div className="flex justify-end gap-3 mt-10">
					<Button
						type="button"
						size="md"
						leftIcon={ <Send size={ 16 }/> }
						onClick={ () => void openModal('sms.send', { message: sms.message }) }
					>
						Wyślij ponownie tę treść
					</Button>
				</div>
			) }
		</div>
	);
}
