import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { Input } from '@/components/ui/fields';
import { TagSelect } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { usePersons } from '@/modules/persons/hooks/usePersons';
import { useListGroupOptions } from '../hooks/ui/useListGroupOptions.ts';
import { useAddOneOffPayment, useUpdateOneOffPayment } from '../hooks/usePaymentMutations';
import { oneOffFormSchema, type OneOffFormValues, parseAmount } from '../schemas/paymentSchemas';
import { toPersonOptions } from '@/modules/persons/utils/personOptions';
import type { PaymentListView, PaymentView, SaveOneOffPaymentPayload } from '../types/types.ts';


interface OneOffPaymentModalProps {
	list: PaymentListView;
	/** The charge being edited. Absent when adding one, which is what puts the person picker on the form. */
	payment?: PaymentView;
}


/**
 * A charge added by hand for one list only.
 *
 * No discount applies to it, and nothing regenerates it - which is exactly why it is the only kind of charge that
 * can be edited here at all. A membership-derived one would be put back by the next recalculation.
 */
export default function OneOffPaymentModal({ list, payment }: OneOffPaymentModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const persons = usePersons();
	const groups = useListGroupOptions(list);

	const addOneOff = useAddOneOffPayment();
	const updateOneOff = useUpdateOneOffPayment();

	const isEditing = payment !== undefined;
	const billsGroups = list.requiresGroup;

	const personOptions = toPersonOptions(persons.data ?? []);

	const form = useForm<OneOffFormValues>({
		resolver: zodResolver(oneOffFormSchema),
		defaultValues: {
			personId: payment?.personId ?? '',
			groupId: payment?.groupId ?? '',
			description: billsGroups ? '' : payment?.description ?? '',
			// A new charge on a list with a fixed price starts at that price, as one added with its person would.
			unitCost: payment === undefined ? ( list.fixedPrice == null ? '' : String(list.fixedPrice) ) : String(payment.unitCost),
			quantity: payment === undefined ? '1' : String(Number(payment.quantity.toFixed(2))),
		},
	});

	const { register, control, handleSubmit, setError, formState: { errors } } = form;

	const [typedCost, typedQuantity] = useWatch({ control, name: ['unitCost', 'quantity'] });

	const unitCost = parseAmount(typedCost);
	const quantity = parseAmount(typedQuantity);
	const total = Number.isNaN(unitCost) || Number.isNaN(quantity) ? null : unitCost * quantity;

	const onSubmit = handleSubmit((values) => {
		if (billsGroups && values.groupId === '') {
			setError('groupId', { message: 'Wybierz grupę, której dotyczy ta opłata.' });
			return;
		}

		if (!billsGroups && values.description === '') {
			setError('description', { message: 'Podaj, za co jest ta opłata.' });
			return;
		}

		const payload: SaveOneOffPaymentPayload = {
			...( billsGroups ? { groupId: values.groupId } : { description: values.description } ),
			unitCost: parseAmount(values.unitCost),
			quantity: parseAmount(values.quantity),
		};

		if (isEditing) {
			updateOneOff.mutate(
				{ id: payment.id, listId: list.id, payload },
				{
					onSuccess: () => {
						notifySuccess('Zapisano zmiany.');
						closeModal();
					},
				},
			);

			return;
		}

		if (values.personId === '') {
			setError('personId', { message: 'Wybierz osobę, której dotyczy opłata.' });
			return;
		}

		addOneOff.mutate(
			{ listId: list.id, payload: { ...payload, personId: values.personId } },
			{
				onSuccess: (created) => {
					notifySuccess(`Dodano opłatę ${ created.code }.`);
					closeModal();
				},
			},
		);
	});

	const busy = addOneOff.isPending || updateOneOff.isPending;
	const failure = addOneOff.error ?? updateOneOff.error;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-2 space-y-5">
			{ isEditing ? (
				<p className="text-base text-os-text-muted ml-0.5 mb-7">{ payment.code } · { payment.personName }</p>
			) : (
				<Controller
					control={ control }
					name="personId"
					render={ ({ field }) => (
						<ExtendedSelect
							label="Osoba"
							options={ personOptions }
							value={ field.value === '' ? undefined : field.value }
							onChange={ (id) => field.onChange(id ?? '') }
							onBlur={ field.onBlur }
							disabled={ busy || persons.isPending }
							clearable
							error={ errors.personId?.message }
							placeholder={ persons.isPending ? 'Wczytywanie osób...' : 'Wybierz osobę' }
						/>
					) }
				/>
			) }

			{ billsGroups ? (
				<Controller
					control={ control }
					name="groupId"
					render={ ({ field }) => (
						<TagSelect
							label="Opłacana grupa"
							options={ groups.options }
							value={ field.value === '' ? undefined : field.value }
							onChange={ (id) => field.onChange(id ?? '') }
							onBlur={ field.onBlur }
							disabled={ busy || groups.isPending }
							clearable
							error={ errors.groupId?.message }
							placeholder={ groups.isPending ? 'Wczytywanie grup...' : 'Wybierz grupę' }
						/>
					) }
				/>
			) : (
				<Input
					label="Płatność za"
					autoComplete="off"
					autoFocus={ isEditing }
					maxLength={ 255 }
					placeholder="np. Opłata za obóz"
					disabled={ busy }
					error={ errors.description?.message }
					{ ...register('description') }
				/>
			) }

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Input
					label="Kwota"
					inputMode="decimal"
					autoComplete="off"
					placeholder="0"
					disabled={ busy }
					error={ errors.unitCost?.message }
					{ ...register('unitCost') }
				/>

				<Input
					label="Ilość"
					type="number"
					inputMode="decimal"
					autoComplete="off"
					disabled={ busy }
					error={ errors.quantity?.message }
					{ ...register('quantity') }
				/>
			</div>

			{ total !== null && total > 0 && (
				<Alert tone="info">Do zapłaty: <strong>{ formatCurrency(total) }</strong></Alert>
			) }

			{ persons.isError && !isEditing && (
				<Alert tone="warning">Wczytywanie listy osób się nie powiodło, więc dodanie nowej opłaty jest teraz niedostępne.</Alert>
			) }

			{ groups.isError && billsGroups && (
				<Alert tone="warning">Wczytywanie grup się nie powiodło, więc zapisanie opłaty jest teraz niedostępne.</Alert>
			) }

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
						Dodaj opłatę
					</Button>
				) }
			</div>
		</form>
	);
}
