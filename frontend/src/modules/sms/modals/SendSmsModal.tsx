import { useState } from 'react';
import { CircleHelp, Send } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { Textarea } from '@/components/ui/fields';
import { TagSelect } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { pluralise } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { buildGroupOptions } from '@/modules/groups/types/groupRows.ts';
import { usePersons } from '@/modules/persons/hooks/usePersons';
import { toPersonOptions } from '@/modules/persons/utils/personOptions';
import { useModalStore } from '@/stores/modalStore';
import { SmsMessageMeter } from '../components/sendSms/SmsMessageMeter';
import { SmsSendReport } from '../components/sendSms/SmsSendReport';
import { useSendSms } from '../hooks/useSmsMutations';
import { buildRecipientPreview } from '../utils/smsRecipients.ts';
import type { SmsSendResultView } from '../types/types.ts';


const MAX_LENGTH = 320;


interface SendSmsModalProps {
	message?: string;
}


export default function SendSmsModal({ message: initialMessage }: SendSmsModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const persons = usePersons();
	const groups = useGroups();
	const sendSms = useSendSms();

	const [message, setMessage] = useState(initialMessage ?? '');
	const [personIds, setPersonIds] = useState<string[]>([]);
	const [groupIds, setGroupIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const [result, setResult] = useState<SmsSendResultView | null>(null);

	const personList = persons.data ?? [];
	const groupList = groups.data ?? [];

	const personOptions = toPersonOptions(personList);
	const groupOptions = buildGroupOptions(groupList.filter((group) => group.active));

	const preview = buildRecipientPreview(personList, personIds, groupIds);
	const missingPhoneRecipients = preview.unreachable;
	const hasOnlyUnreachableRecipients = preview.reachable.length === 0 && preview.unreachable.length > 0;

	const trimmed = message.trim();
	const busy = sendSms.isPending;

	const submit = () => {
		setError(null);

		if (trimmed === '') {
			setError('Wpisz treść wiadomości.');
			return;
		}

		if (trimmed.length > MAX_LENGTH) {
			setError(`Wiadomość może mieć najwyżej ${ MAX_LENGTH } znaków bez polskich znaków lub 140 z polskimi znakami.`);
			return;
		}

		if (personIds.length === 0 && groupIds.length === 0) {
			setError('Wybierz co najmniej jedną osobę lub grupę.');
			return;
		}

		sendSms.mutate(
			{ message: trimmed, personIds, groupIds },
			{
				onSuccess: (sent) => {
					const count = sent.sent.length;

					notifySuccess(`Wysłano ${ count } ${ pluralise(count, 'wiadomość', 'wiadomości', 'wiadomości') }.`);

					if (sent.skipped.length === 0) {
						closeModal();
						return;
					}

					setResult(sent);
				},
				onError: (failure) => setError(failure.message),
			},
		);
	};

	if (persons.isError) {
		return <Alert tone="danger">{ persons.error.message }</Alert>;
	}

	if (result !== null) {
		return (
			<div className="mt-2 flex-col">
				<SmsSendReport result={ result }/>

				<div className="mt-auto flex justify-end pt-5">
					<Button type="button" size="md" onClick={ closeModal }>
						Zamknij
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="mt-2 flex min-h-160 flex-col gap-5">
			<div className="space-y-2">
				<Textarea
					label="Treść wiadomości"
					value={ message }
					onChange={ (event) => setMessage(event.target.value) }
					maxLength={ MAX_LENGTH }
					minRows={ 4 }
					maxRows={ 8 }
					disabled={ busy }
					placeholder="Wpisz treść SMS, którą dostaną wybrane osoby"
				/>

				<SmsMessageMeter message={ trimmed } maxLength={ MAX_LENGTH }/>
			</div>

			<ExtendedSelect
				multiple
				label="Osoby"
				options={ personOptions }
				value={ personIds }
				onChange={ setPersonIds }
				disabled={ busy || persons.isPending }
				clearable
				placeholder={ persons.isPending ? 'Wczytywanie osób...' : 'Wybierz osoby' }
			/>

			<div className="space-y-1">
				<TagSelect
					multiple
					label="Grupy"
					options={ groupOptions }
					value={ groupIds }
					onChange={ setGroupIds }
					disabled={ busy || groups.isPending }
					clearable
					placeholder={ groups.isPending ? 'Wczytywanie grup...' : 'Wybierz grupy' }
				/>

				<p className="text-xs text-os-text-muted px-2">Wiadomość trafi do wszystkich aktywnych osób zapisanych do wybranych grup.</p>
			</div>

			<Alert tone={ hasOnlyUnreachableRecipients ? 'danger' : 'info' } className="mt-3">
				{ preview.reachable.length > 0 ? (
					<>
						Wiadomość trafi do <span className="font-semibold">{ preview.reachable.length }</span> { pluralise(preview.reachable.length, 'osoby', 'osób', 'osób') } na{ ' ' }
						<span className="font-semibold">{ preview.messageCount }</span> { pluralise(preview.messageCount, 'numer', 'numery', 'numerów') }.
						{ preview.messageCount < preview.reachable.length && ' Osoby dzielące jeden numer dostaną jedną wspólną wiadomość.' }
					</>
				) : hasOnlyUnreachableRecipients
					? 'Do nikogo z wybranych osób SMS nie dotrze.'
					: 'Wybierz osoby lub grupy, aby dowiedzieć się do jak wielu osób dotrze SMS.' }
			</Alert>

			{ missingPhoneRecipients.length > 0 && (
				<div className="flex items-start gap-3">
					<Alert tone="warning" title={ `Bez numeru telefonu (${ missingPhoneRecipients.length })` } className="flex-1">
						Wykryto osoby bez podanego numeru - zostaną pominięte przy wysyłce.
					</Alert>

					<Tooltip
						placement="right-start"
						content={
							<ul className="space-y-0.5 pr-1">
								{ missingPhoneRecipients.map((person) => (
									<li key={ person.id }>{ person.fullName }</li>
								)) }
							</ul>
						}
						className="shrink-0 self-center text-os-warning"
					>
						<CircleHelp aria-label="Pokaż osoby bez numeru telefonu" className="size-6"/>
					</Tooltip>
				</div>
			) }

			{ error !== null && <Alert tone="danger">{ error }</Alert> }

			<div className="mt-auto flex shrink-0 justify-end gap-3 pt-5">
				<Button
					type="button"
					variant="secondary_muted"
					size="md"
					disabled={ busy }
					onClick={ closeModal }
				>
					Anuluj
				</Button>

				<Button
					type="button"
					size="md"
					isLoading={ busy }
					disabled={ trimmed === '' || ( personIds.length === 0 && groupIds.length === 0 ) }
					onClick={ submit }
					leftIcon={ <Send size={ 16 }/> }
				>
					Wyślij
				</Button>
			</div>
		</div>
	);
}
