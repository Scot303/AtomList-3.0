import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { ExtendedSelect, type ExtendedSelectOption } from '@/components/ui/extendedSelect';
import { ColorPicker, FormSection, Input, Textarea, Toggle } from '@/components/ui/fields';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { useCreateGroup, useUpdateGroup } from '../../hooks/useGroupMutations';
import { groupFormSchema, type GroupFormValues } from '../../schemas/groupSchemas';
import { blankGroupForm, buildCreatePayload, buildUpdatePayload, groupToForm } from '../../utils/groupForm';
import type { GroupView } from '../../types/types.ts';
import { cn } from "@/lib/cn.ts";


const BILLING_OPTIONS: ExtendedSelectOption[] = [
	{ id: 'MONTHLY', name: 'Miesięczne', hint: 'stała kwota' },
	{ id: 'PER_CLASS', name: 'Za wejście', hint: 'liczone od obecności' },
];


interface GroupFormProps {
	/** The group being edited. Absent for a new one, which is what puts the form in creating mode. */
	group?: GroupView;
}

/**
 * Everything held about one group, whether it exists yet or not.
 */
export const GroupForm = ({ group }: GroupFormProps) => {
	const closeModal = useModalStore((state) => state.closeModal);

	const createGroup = useCreateGroup();
	const updateGroup = useUpdateGroup();

	const form = useForm<GroupFormValues>({
		resolver: zodResolver(groupFormSchema),
		defaultValues: group === undefined ? blankGroupForm() : groupToForm(group),
	});

	const { register, control, handleSubmit, formState: { errors } } = form;

	const onSubmit = handleSubmit((values) => {
		if (group === undefined) {
			createGroup.mutate(
				buildCreatePayload(values),
				{
					onSuccess: (created) => {
						notifySuccess(`Dodano grupę ${ created.name }.`);
						closeModal();
					},
				},
			);

			return;
		}

		const payload = buildUpdatePayload(values, group);

		// Nothing was touched, so there is nothing to send.
		if (Object.keys(payload).length === 0) {
			closeModal();
			return;
		}

		updateGroup.mutate(
			{ id: group.id, payload },
			{
				onSuccess: () => {
					notifySuccess('Zapisano zmiany.');
					closeModal();
				},
			},
		);
	});

	const busy = createGroup.isPending || updateGroup.isPending;

	const failure = createGroup.error ?? updateGroup.error;

	const isEditing = group !== undefined;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-3 space-y-5">
			<FormSection title="Grupa">
				<Input
					label="Nazwa"
					autoFocus
					autoComplete="off"
					maxLength={ 128 }
					disabled={ busy }
					error={ errors.name?.message }
					{ ...register('name') }
				/>

				<Input
					label="Koszt uczestnictwa"
					inputMode="decimal"
					autoComplete="off"
					placeholder="0"
					disabled={ busy }
					error={ errors.costForAttending?.message }
					{ ...register('costForAttending') }
				/>

				<Controller
					control={ control }
					name="billingType"
					render={ ({ field }) => (
						<ExtendedSelect
							label="Rozliczenie"
							options={ BILLING_OPTIONS }
							value={ field.value }
							onChange={ (id) => {
								if (id !== undefined) {
									field.onChange(id);
								}
							} }
							onBlur={ field.onBlur }
							disabled={ busy }
							searchable={ false }
						/>
					) }
				/>
			</FormSection>

			<FormSection title="Oznaczenie">
				<Controller
					control={ control }
					name="color"
					render={ ({ field }) => (
						<ColorPicker
							shades
							recent
							label="Kolor grupy"
							placeholder="np. 3B82F6"
							value={ field.value }
							onChange={ field.onChange }
							onBlur={ field.onBlur }
							disabled={ busy }
							error={ errors.color?.message }
						/>
					) }
				/>

				<div className={ cn("styled-card flex flex-col justify-center rounded-xl px-3 py-1 sm:col-span-2",
					group === undefined && 'mt-3'
				) }>
					<Controller
						control={ control }
						name="tournamentGroup"
						render={ ({ field }) => (
							<Toggle
								label="Grupa turniejowa"
								checked={ field.value }
								onChange={ field.onChange }
								disabled={ busy }
								compact
							/>
						) }
					/>

					{ isEditing && (
						<Controller
							control={ control }
							name="active"
							render={ ({ field }) => (
								<Toggle
									label="Aktywna"
									description="Do nieaktywnej grupy nie da się dopisać nowych osób."
									checked={ field.value }
									onChange={ field.onChange }
									disabled={ busy }
									compact
								/>
							) }
						/>
					) }
				</div>
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
						Dodaj grupę
					</Button>
				) }
			</div>
		</form>
	);
};
