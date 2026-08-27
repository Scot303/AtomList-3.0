import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { TagSelect } from '@/components/ui/tags';
import { pluralise } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { usePersons } from '@/modules/persons/hooks/queries/usePersons.ts';
import { toPersonOptions } from '@/modules/persons/utils/personOptions';
import { useListGroupOptions } from '../hooks/ui/useListGroupOptions.ts';
import { useAddPersonsToList } from '../hooks/mutations/usePaymentListMutations.ts';
import { usePayments } from '../hooks/queries/usePayments.ts';
import type { PaymentListView } from '../types/types.ts';


interface AddPersonsModalProps {
	list: PaymentListView;
}


/**
 * Puts people on the list, each with one charge to fill in afterwards.
 *
 * Anybody the new charge would duplicate is skipped by the backend, so those are left out of the picker rather than offered and silently ignored.
 */
export default function AddPersonsModal({ list }: AddPersonsModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const persons = usePersons();
	const payments = usePayments(list.id);
	const groups = useListGroupOptions(list);
	const addPersons = useAddPersonsToList();

	const billsGroups = list.requiresGroup;

	const [selected, setSelected] = useState<string[]>([]);
	const [groupId, setGroupId] = useState<string | undefined>(undefined);
	const [error, setError] = useState<string | null>(null);

	// Somebody billed for another group belongs on the sheet twice, so only a charge for this same group makes them already there.
	// Without a group there is one row per person, and being on the list at all is enough.
	const alreadyBilled = new Set(
		( payments.data ?? [] )
			.filter((payment) => !billsGroups || payment.groupId === groupId)
			.map((payment) => payment.personId),
	);

	const options = toPersonOptions(( persons.data ?? [] ).filter((person) => !alreadyBilled.has(person.id)));

	const submit = () => {
		setError(null);

		if (billsGroups && groupId === undefined) {
			setError('Wybierz grupę, za którą mają zostać rozliczone te osoby.');
			return;
		}

		if (selected.length === 0) {
			setError('Wybierz co najmniej jedną osobę.');
			return;
		}

		addPersons.mutate(
			{ id: list.id, payload: { personIds: selected, groupId } },
			{
				onSuccess: () => {
					notifySuccess(`Dodano ${ selected.length } ${ pluralise(selected.length, 'osobę', 'osoby', 'osób') }.`);
					closeModal();
				},
				onError: (failure) => setError(failure.message),
			},
		);
	};

	if (persons.isError) {
		return <Alert tone="danger">{ persons.error.message }</Alert>;
	}

	const busy = addPersons.isPending;

	const awaitingGroup = billsGroups && groupId === undefined;

	return (
		<div className="mt-2 space-y-5">
			{ billsGroups && (
				<TagSelect
					label="Grupa"
					options={ groups.options }
					value={ groupId }
					onChange={ (id) => {
						setGroupId(id);
						setSelected([]);
					} }
					disabled={ busy || groups.isPending }
					clearable
					placeholder={ groups.isPending ? 'Wczytywanie grup...' : 'Wybierz grupę' }
				/>
			) }

			<ExtendedSelect
				multiple
				label="Osoby"
				options={ options }
				value={ selected }
				onChange={ setSelected }
				disabled={ busy || persons.isPending || awaitingGroup }
				clearable
				placeholder={
					awaitingGroup
						? 'Najpierw wybierz grupę'
						: persons.isPending
							? 'Wczytywanie osób...'
							: options.length === 0 ? 'Wszyscy z grupy są już na tej liście' : 'Wybierz osoby'
				}
			/>

			{ groups.isError && billsGroups && (
				<Alert tone="warning">Wczytywanie grup się nie powiodło, więc dodawanie nowych osób jest teraz niedostępne.</Alert>
			) }

			{ error !== null && <Alert tone="danger">{ error }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
					Anuluj
				</Button>

				<Button
					type="button"
					size="md"
					isLoading={ busy }
					disabled={ awaitingGroup || options.length === 0 }
					onClick={ submit }
					leftIcon={ <UserPlus size={ 16 }/> }
				>
					Dodaj
				</Button>
			</div>
		</div>
	);
}
