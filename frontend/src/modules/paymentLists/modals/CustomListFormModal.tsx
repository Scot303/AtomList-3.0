import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Input, Textarea } from '@/components/ui/fields';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { ListFacts } from '../components/customList/ListFacts';
import { PopulationFields } from '../components/customList/PopulationFields';
import { useCreateCustomList, useUpdateCustomList } from '../hooks/usePaymentListMutations';
import { customListFormSchema, type CustomListFormValues } from '../schemas/listSchemas';
import { buildCreatePayload, buildUpdatePayload, customListToForm } from '../utils/customListForm.ts';
import type { PaymentListView } from '../types/types.ts';


interface CustomListFormModalProps {
	/** The list being edited. Absent when adding one, which is what puts the whole form on screen. */
	list?: PaymentListView;
}


export default function CustomListFormModal({ list }: CustomListFormModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const createList = useCreateCustomList();
	const updateList = useUpdateCustomList();

	const isEditing = list !== undefined;
	const frozen = list?.closed === true;

	const form = useForm<CustomListFormValues>({
		resolver: zodResolver(customListFormSchema),
		mode: "onTouched",
		defaultValues: customListToForm(list),
	});

	const { register, control, handleSubmit, setError, formState: { errors } } = form;

	const onSubmit = handleSubmit((values) => {
		if (isEditing) {
			const payload = buildUpdatePayload(values, list);

			// Nothing was touched, so there is nothing to send.
			if (Object.keys(payload).length === 0) {
				closeModal();
				return;
			}

			updateList.mutate(
				{ id: list.id, payload },
				{
					onSuccess: () => {
						notifySuccess('Zapisano zmiany.');
						closeModal();
					},
				},
			);

			return;
		}

		if (values.populationMode === 'BY_GROUPS' && values.groupIds.length === 0) {
			setError('groupIds', { message: 'Wybierz co najmniej jedną grupę, z której ma powstać lista.' });
			return;
		}

		if (values.populationMode === 'BY_PERSONS' && values.personIds.length === 0) {
			setError('personIds', { message: 'Wybierz co najmniej jedną osobę.' });
			return;
		}

		createList.mutate(buildCreatePayload(values), {
			onSuccess: (created) => {
				notifySuccess(`Utworzono listę ${ created.name ?? '' }.`);
				closeModal();
			},
		});
	});

	const busy = createList.isPending || updateList.isPending;
	const failure = createList.error ?? updateList.error;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-3 space-y-5">
			{ isEditing && <ListFacts list={ list }/> }

			{ frozen && (
				<Alert tone="warning" contentClassName="text-sm">
					Ta lista jest zamknięta, więc nie można jej już zmieniać. Otwórz ją ponownie, jeśli zmiana jest naprawdę potrzebna.
				</Alert>
			) }

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Input
					label="Nazwa"
					autoFocus
					autoComplete="off"
					maxLength={ 255 }
					placeholder="np. Obóz letni 2027"
					disabled={ busy || frozen }
					error={ errors.name?.message }
					{ ...register('name') }
				/>

				<Input
					label="Cena domyślna"
					inputMode="decimal"
					autoComplete="off"
					placeholder="np. 2400"
					hint={ isEditing ? 'Dotyczy pozycji dodanych od teraz' : 'Stała kwota każdej płatności na liście' }
					disabled={ busy || frozen }
					error={ errors.fixedPrice?.message }
					{ ...register('fixedPrice') }
				/>
			</div>

			{ !isEditing && ( <PopulationFields control={ control } busy={ busy }/> ) }

			<Textarea
				label="Notatka"
				maxLength={ 512 }
				minRows={ 2 }
				disabled={ busy || frozen }
				error={ errors.note?.message }
				{ ...register('note') }
			/>

			{ failure !== null && <Alert tone="danger">{ failure.message }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
					{ frozen ? 'Zamknij' : 'Anuluj' }
				</Button>

				{ isEditing ? (
					<Button type="submit" size="md" isLoading={ busy } disabled={ frozen } leftIcon={ <Save size={ 16 }/> }>
						Zapisz
					</Button>
				) : (
					<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Plus size={ 16 }/> }>
						Utwórz listę
					</Button>
				) }
			</div>
		</form>
	);
}
