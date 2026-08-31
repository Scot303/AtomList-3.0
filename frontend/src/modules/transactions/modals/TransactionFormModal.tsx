import { useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { TagSelect } from '@/components/ui/tags';
import { notifySuccess } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useInstructors } from '@/modules/instructors/hooks/useInstructors.ts';
import { toInstructorOptions } from '@/modules/instructors/utils/instructorOptions.ts';
import type { InstructorView } from '@/modules/instructors/types/types.ts';
import { useModalStore } from '@/stores/modalStore';
import { dateToISO, todayInTimeZone } from '@/utils/dateUtils.ts';
import { TransactionFormFields } from '../components/TransactionFormFields.tsx';
import { useCreateTransaction } from '../hooks/mutations/useTransactionMutations.ts';
import { parseAmount, transactionFormSchema, type TransactionFormValues } from '../schemas/transactionSchemas.ts';
import { EXPENSE_ID, INCOME_ID, TRANSACTION_TYPE_OPTIONS } from '../types/transactionRows.ts';
import type { CreateTransactionPayload, TransactionType } from '../types/types.ts';


interface TransactionFormModalProps {
	listId: string;
	initialType?: TransactionType;
}


export default function TransactionFormModal({ listId, initialType = EXPENSE_ID }: TransactionFormModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);
	const { hasPermission } = useAuth();

	const instructors = useInstructors();
	const createTransaction = useCreateTransaction();

	const form = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionFormSchema),
		mode: "onTouched",
		defaultValues: {
			name: '',
			type: initialType,
			amount: '',
			quantity: '1',
			invoiceNumber: '',
			paymentDate: dateToISO(todayInTimeZone()),
			instructorId: '',
			note: '',
		},
	});

	const { control, handleSubmit, getValues, setValue, clearErrors } = form;

	const type = useWatch({ control, name: 'type' });
	const isExpense = type === EXPENSE_ID;

	const canAddIncome = hasPermission('MODIFY_INCOME_TRANSACTIONS');
	const canAddExpense = hasPermission('MODIFY_EXPENSE_TRANSACTIONS');

	const typeOptions = TRANSACTION_TYPE_OPTIONS.map((option) => ( {
		...option,
		disabled: option.id === INCOME_ID ? !canAddIncome : !canAddExpense,
		hint: ( option.id === INCOME_ID ? canAddIncome : canAddExpense ) ? undefined : 'brak uprawnień',
	} ));

	const derivedFrom = useRef<InstructorView | null>(null);

	const applyInstructor = (instructor: InstructorView | null) => {
		clearErrors();

		const previous = derivedFrom.current;
		const { name, amount } = getValues();

		if (name === '' || name === previous?.fullName) {
			setValue('name', instructor?.fullName ?? '', { shouldValidate: name !== '' });
		}

		if (amount === '' || amount === asAmount(previous)) {
			setValue('amount', asAmount(instructor), { shouldValidate: amount !== '' });
		}

		derivedFrom.current = instructor;
	};

	const onSubmit = handleSubmit((values) => {
		const payload: CreateTransactionPayload = {
			name: values.name.trim(),
			type: values.type,
			amount: parseAmount(values.amount),
			quantity: parseAmount(values.quantity),
			...( values.invoiceNumber === '' ? {} : { invoiceNumber: values.invoiceNumber.trim() } ),
			...( values.paymentDate === '' ? {} : { paymentDate: values.paymentDate } ),
			...( values.instructorId === '' || values.type !== EXPENSE_ID ? {} : { instructorId: values.instructorId } ),
			...( values.note === '' ? {} : { note: values.note.trim() } ),
		};

		createTransaction.mutate(
			{ listId, payload },
			{
				onSuccess: (created) => {
					notifySuccess(`Dodano pozycję „${ created.name }”.`);
					closeModal();
				},
			},
		);
	});

	const busy = createTransaction.isPending;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-2 space-y-5">
			<Controller
				control={ control }
				name="type"
				render={ ({ field }) => (
					<TagSelect
						label="Rodzaj"
						options={ typeOptions }
						searchable={ false }
						value={ field.value }
						onChange={ (id) => {
							field.onChange(( id ?? EXPENSE_ID ) as TransactionType);

							if (id !== EXPENSE_ID) {
								setValue('instructorId', '');
								applyInstructor(null);
							}
						} }
						onBlur={ field.onBlur }
						disabled={ busy }
					/>
				) }
			/>

			{ isExpense && (
				<Controller
					control={ control }
					name="instructorId"
					render={ ({ field }) => (
						<ExtendedSelect
							label="Instruktor"
							options={ toInstructorOptions(instructors.data ?? []) }
							value={ field.value === '' ? undefined : field.value }
							onChange={ (id) => {
								field.onChange(id ?? '');
								applyInstructor(( instructors.data ?? [] ).find((candidate) => candidate.id === id) ?? null);
							} }
							onBlur={ field.onBlur }
							disabled={ busy || instructors.isPending }
							clearable
							placeholder={ instructors.isPending ? 'Wczytywanie instruktorów...' : 'Bez instruktora - wydatek za coś innego (zostaw puste)' }
						/>
					) }
				/>
			) }

			<TransactionFormFields control={ control } disabled={ busy }/>

			{ instructors.isError && isExpense && (
				<Alert tone="warning">
					Wczytywanie instruktorów się nie powiodło. Pozycję można nadal zapisać, ale bez przypisania jej do instruktora.
				</Alert>
			) }

			{ createTransaction.error !== null && <Alert tone="danger">{ createTransaction.error.message }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
					Anuluj
				</Button>

				<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Plus size={ 16 }/> }>
					Dodaj pozycję
				</Button>
			</div>
		</form>
	);
}


function asAmount(instructor: InstructorView | null): string {
	return instructor === null ? '' : String(instructor.costPerHour);
}
