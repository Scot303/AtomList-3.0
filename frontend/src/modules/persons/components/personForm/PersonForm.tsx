import { zodResolver } from '@hookform/resolvers/zod';
import { Percent, Save, UserPlus, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Textarea } from '@/components/ui/fields';
import { notifySuccess } from '@/lib/toast';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { usePrefetchMemberships } from '../../hooks/queries/useMemberships.ts';
import { usePrefetchPersonDiscounts } from '../../hooks/mutations/usePersonDiscounts.ts';
import { useCreatePerson, useUpdatePerson } from '../../hooks/mutations/usePersonMutations.ts';
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
	const openModal = useModalStore((state) => state.openModal);

	const createPerson = useCreatePerson();
	const updatePerson = useUpdatePerson();

	const prefetchMemberships = usePrefetchMemberships();
	const prefetchDiscounts = usePrefetchPersonDiscounts();

	const personId = person?.id;

	const form = useForm<PersonFormValues>({
		resolver: zodResolver(personFormSchema),
		mode: "onTouched",
		defaultValues: person === undefined ? blankPersonForm() : personToForm(person),
	});

	const { register, control, handleSubmit, formState: { errors } } = form;

	const primeGroupsAction = () => {
		preloadModal('persons.groups');

		if (personId !== undefined) {
			prefetchMemberships(personId);
		}
	};

	const primeDiscountsAction = () => {
		preloadModal('persons.discounts');

		if (personId !== undefined) {
			prefetchDiscounts(personId);
		}
	};

	const onSubmit = handleSubmit((values, event) => {
		if (person === undefined) {
			const shouldOpenGroups = ( event?.nativeEvent as SubmitEvent | undefined )?.submitter?.getAttribute('value') === 'groups';

			createPerson.mutate(
				buildCreatePayload(values),
				{
					onSuccess: (created) => {
						notifySuccess(`Dodano ${ created.fullName }.`);

						if (shouldOpenGroups) {
							prefetchMemberships(created.id);

							void openModal('persons.groups', {
								personId: created.id,
								personName: created.fullName,
							});

							return;
						}

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
			<PersonIdentitySection control={ control } busy={ busy }/>

			<PersonContactSection control={ control } busy={ busy } familyPhone={ familyPhone }/>

			<PersonStudioSection control={ control } busy={ busy } showActive={ person !== undefined }/>

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
					<>
						<Button type="submit" size="md" isLoading={ busy } leftIcon={ <UserPlus size={ 16 }/> }>
							Dodaj osobę
						</Button>

						<Button
							type="submit"
							value="groups"
							size="md"
							isLoading={ busy }
							leftIcon={ <Users size={ 16 }/> }
							onMouseEnter={ primeGroupsAction }
							onFocus={ primeGroupsAction }
						>
							Dodaj i przejdź do grup
						</Button>
					</>
				) : (
					<>
						<Button
							type="button"
							variant="secondary_muted"
							size="md"
							disabled={ busy }
							leftIcon={ <Percent size={ 16 }/> }
							onMouseEnter={ primeDiscountsAction }
							onFocus={ primeDiscountsAction }
							onClick={ () => void openModal('persons.discounts', {
								personId: person.id,
								personName: person.fullName,
							}) }
						>
							Zniżki osoby
						</Button>

						<Button
							type="button"
							variant="secondary_muted"
							size="md"
							disabled={ busy }
							leftIcon={ <Users size={ 16 }/> }
							onMouseEnter={ primeGroupsAction }
							onFocus={ primeGroupsAction }
							onClick={ () => void openModal('persons.groups', {
								personId: person.id,
								personName: person.fullName,
							}) }
						>
							Grupy osoby
						</Button>

						<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Save size={ 16 }/> }>
							Zapisz
						</Button>
					</>
				) }
			</div>
		</form>
	);
};
