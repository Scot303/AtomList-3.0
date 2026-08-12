import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Textarea } from '@/components/ui/fields';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { useCreatePerson, useUpdatePerson } from '../../hooks/usePersonMutations';
import { personFormSchema, type PersonFormValues } from '../../schemas/personSchemas';
import { blankPersonForm, buildCreatePayload, buildUpdatePayload, personToForm } from '../../utils/personForm';
import { PersonContactSection } from './PersonContactSection';
import { PersonIdentitySection } from './PersonIdentitySection';
import { PersonStudioSection } from './PersonStudioSection';
import type { PersonView } from '../../types/types.ts';


interface PersonFormProps {
	/** The person being edited. Absent for a new one, which is what puts the form in creating mode. */
	person?: PersonView;
}

/**
 * Everything held about one person, whether they exist yet or not.
 */
export const PersonForm = ({ person }: PersonFormProps) => {
	const closeModal = useModalStore((state) => state.closeModal);

	const createPerson = useCreatePerson();
	const updatePerson = useUpdatePerson();

	const form = useForm<PersonFormValues>({
		resolver: zodResolver(personFormSchema),
		defaultValues: person === undefined ? blankPersonForm() : personToForm(person),
	});

	const { register, handleSubmit, formState: { errors } } = form;


	const onSubmit = handleSubmit((values) => {
		if (person === undefined) {
			createPerson.mutate(
				buildCreatePayload(values),
				{
					onSuccess: (created) => {
						notifySuccess(`Dodano ${ created.fullName }.`);
						closeModal();
					}
				}
			);

			return;
		}

		const payload = buildUpdatePayload(values, person);

		// Nothing was touched, so there is nothing to send.
		if (Object.keys(payload).length === 0) {
			closeModal();
			return;
		}

		updatePerson.mutate(
			{ id: person.id, payload },
			{
				onSuccess: () => {
					notifySuccess('Zapisano zmiany.');
					closeModal();
				}
			}
		);
	});


	const busy = createPerson.isPending || updatePerson.isPending;

	const failure = createPerson.error ?? updatePerson.error;

	/** Effective phone. The family's number is the fallback. */
	const familyPhone = person !== undefined && person.phone === null ? person.effectivePhone : null;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-3 space-y-5">
			<PersonIdentitySection form={ form } busy={ busy }/>

			<PersonContactSection
				form={ form }
				busy={ busy }
				familyPhone={ familyPhone }
			/>

			<PersonStudioSection form={ form } busy={ busy } showActive={ person !== undefined }/>

			<Textarea
				label="Notatka"
				maxLength={ 512 }
				minRows={ 3 }
				disabled={ busy }
				error={ errors.note?.message }
				{ ...register('note') }
			/>

			{ failure !== null && <Alert tone="danger">{ failure.message }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
					Anuluj
				</Button>

				{ person === undefined ? (
					<Button type="submit" size="md" isLoading={ busy } leftIcon={ <UserPlus size={ 16 }/> }>
						Dodaj osobę
					</Button>
				) : (
					<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Save size={ 16 }/> }>
						Zapisz
					</Button>
				) }
			</div>
		</form>
	);
};
