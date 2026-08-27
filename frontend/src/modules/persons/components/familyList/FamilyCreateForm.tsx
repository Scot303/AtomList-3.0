import type { KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/fields';
import { notifySuccess } from '@/lib/toast';
import { PhoneField } from '../PhoneField';
import { useCreateFamily } from '../../hooks/mutations/useFamilyMutations.ts';
import { familyFormSchema, type FamilyFormValues } from '../../schemas/familySchemas';
import { toFamilyPayload } from '../../utils/familyForm';


interface FamilyCreateFormProps {
	onCancel: () => void;
	onCreated: (familyId: string) => void;
}


/**
 * Deliberately not a `<form>`. It is drawn inside a portalled panel, and a submit event there travels up the React tree into whatever form opened the picker.
 */
export const FamilyCreateForm = ({ onCancel, onCreated }: FamilyCreateFormProps) => {

	const createFamily = useCreateFamily();

	const { register, handleSubmit, formState: { errors } } = useForm<FamilyFormValues>({
		resolver: zodResolver(familyFormSchema),
		mode: 'onTouched',
		defaultValues: { name: '', phone: '', note: '' },
	});

	const submit = handleSubmit((values) => {
		createFamily.mutate(
			toFamilyPayload(values),
			{
				onSuccess: (family) => {
					notifySuccess(`Dodano rodzinę ${ family.name }.`);
					onCreated(family.id);
				},
			},
		);
	});

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'Enter') {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		void submit();
	};

	const busy = createFamily.isPending;

	return (
		<div className="themed-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3" onKeyDown={ handleKeyDown }>
			<p className="px-1 mb-5 text-base font-semibold text-os-text">Dodaj nową rodzinę:</p>

			<Input
				label="Nazwa"
				autoComplete="off"
				maxLength={ 128 }
				disabled={ busy }
				error={ errors.name?.message }
				{ ...register('name') }
			/>

			<PhoneField registration={ register('phone') } disabled={ busy } error={ errors.phone?.message }/>

			{ createFamily.error !== null && <Alert tone="danger">{ createFamily.error.message }</Alert> }

			<div className="flex justify-end gap-2 pt-1">
				<Button type="button" variant="secondary_muted" size="sm" disabled={ busy } onClick={ onCancel }>
					Anuluj
				</Button>

				<Button type="button" size="sm" isLoading={ busy } leftIcon={ <Plus size={ 14 }/> } onClick={ () => void submit() }>
					Dodaj
				</Button>
			</div>
		</div>
	);
};
