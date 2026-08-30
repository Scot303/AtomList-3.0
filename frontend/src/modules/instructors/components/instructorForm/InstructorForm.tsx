import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { DatePicker, FormSection, Input, Textarea } from '@/components/ui/fields';
import { TagSelect } from '@/components/ui/tags';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { ACTIVE_ID, toActiveTag } from '@/types/rowTags.ts';
import { useCreateInstructor, useUpdateInstructor } from '../../hooks/useInstructorMutations.ts';
import { instructorFormSchema, type InstructorFormValues } from '../../schemas/instructorSchemas.ts';
import { CONTRACT_TYPE_OPTIONS, INSTRUCTOR_ACTIVE_TAG_OPTIONS } from '../../types/instructorRows.ts';
import { blankInstructorForm, buildCreatePayload, buildUpdatePayload, instructorToForm } from '../../utils/instructorForm.ts';
import type { InstructorView } from '../../types/types.ts';


interface InstructorFormProps {
	instructor?: InstructorView;
}


export const InstructorForm = ({ instructor }: InstructorFormProps) => {
	const closeModal = useModalStore((state) => state.closeModal);

	const createInstructor = useCreateInstructor();
	const updateInstructor = useUpdateInstructor();

	const form = useForm<InstructorFormValues>({
		resolver: zodResolver(instructorFormSchema),
		defaultValues: instructor === undefined ? blankInstructorForm() : instructorToForm(instructor),
	});

	const { register, control, handleSubmit, formState: { errors } } = form;

	const onSubmit = handleSubmit((values) => {
		if (instructor === undefined) {
			createInstructor.mutate(
				buildCreatePayload(values),
				{
					onSuccess: (created) => {
						notifySuccess(`Dodano instruktora ${ created.fullName }.`);
						closeModal();
					},
				},
			);

			return;
		}

		const payload = buildUpdatePayload(values, instructor);

		// Nothing was touched, so there is nothing to send.
		if (Object.keys(payload).length === 0) {
			closeModal();
			return;
		}

		updateInstructor.mutate(
			{ id: instructor.id, payload },
			{
				onSuccess: () => {
					notifySuccess('Zapisano zmiany.');
					closeModal();
				},
			},
		);
	});

	const busy = createInstructor.isPending || updateInstructor.isPending;

	const failure = createInstructor.error ?? updateInstructor.error;

	const isEditing = instructor !== undefined;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-3 space-y-5">
			<FormSection title="Dane podstawowe">
				<Input
					label="Imię"
					autoFocus
					autoComplete="off"
					maxLength={ 128 }
					disabled={ busy }
					error={ errors.name?.message }
					{ ...register('name') }
				/>

				<Input
					label="Nazwisko"
					autoComplete="off"
					maxLength={ 128 }
					disabled={ busy }
					error={ errors.lastName?.message }
					{ ...register('lastName') }
				/>

				<Input
					label="Stawka godzinowa"
					inputMode="decimal"
					autoComplete="off"
					placeholder="0"
					disabled={ busy }
					error={ errors.costPerHour?.message }
					{ ...register('costPerHour') }
				/>
			</FormSection>

			<FormSection title="Umowa">
				<Controller
					control={ control }
					name="contractType"
					render={ ({ field }) => (
						<TagSelect
							label="Rodzaj umowy"
							options={ CONTRACT_TYPE_OPTIONS }
							searchable={ false }
							value={ field.value }
							onChange={ (id) => {
								if (id !== undefined) {
									field.onChange(id);
								}
							} }
							onBlur={ field.onBlur }
							disabled={ busy }
							error={ errors.contractType?.message }
						/>
					) }
				/>

				<Input
					label="Nr umowy"
					autoComplete="off"
					maxLength={ 64 }
					placeholder="np. UM 12/2026"
					disabled={ busy }
					error={ errors.contractNumber?.message }
					{ ...register('contractNumber') }
				/>

				<Controller
					control={ control }
					name="contractSignedDate"
					render={ ({ field }) => (
						<DatePicker
							label="Data podpisania"
							value={ field.value }
							onChange={ field.onChange }
							onBlur={ field.onBlur }
							disabled={ busy }
							error={ errors.contractSignedDate?.message }
						/>
					) }
				/>

				{ isEditing && (
					<Controller
						control={ control }
						name="active"
						render={ ({ field }) => (
							<TagSelect
								label="Status instruktora"
								options={ INSTRUCTOR_ACTIVE_TAG_OPTIONS }
								searchable={ false }
								value={ toActiveTag(field.value) }
								onChange={ (value) => {
									if (value !== undefined) {
										field.onChange(value === ACTIVE_ID);
									}
								} }
								onBlur={ field.onBlur }
								disabled={ busy }
								error={ errors.active?.message }
							/>
						) }
					/>
				) }
			</FormSection>

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

				{ isEditing ? (
					<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Save size={ 16 }/> }>
						Zapisz
					</Button>
				) : (
					<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Plus size={ 16 }/> }>
						Dodaj instruktora
					</Button>
				) }
			</div>
		</form>
	);
};
