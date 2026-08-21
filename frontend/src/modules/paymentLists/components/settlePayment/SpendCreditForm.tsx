import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { Input } from '@/components/ui/fields';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { formatCurrency } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { useAllocateDeposit } from '@/modules/deposits/hooks/useDepositMutations';
import { allocateFormSchema, type AllocateFormValues, parseAmount } from '../../schemas/paymentSchemas';
import { PAYMENT_METHOD_NAMES } from '@/types/finance.ts';
import type { DepositView } from '@/modules/deposits/types/types.ts';
import type { PaymentView } from '../../types/types.ts';


/**
 * Money already in hand: what is left of an earlier handover goes against this charge.
 */
export function SpendCreditForm({ payment, deposits }: { payment: PaymentView; deposits: DepositView[] }) {
	const closeModal = useModalStore((state) => state.closeModal);

	const allocate = useAllocateDeposit();

	const options = deposits.map((deposit) => ( {
		id: deposit.id,
		name: `${ deposit.code } · ${ formatCurrency(deposit.unallocatedAmount) }`,
		hint: `${ PAYMENT_METHOD_NAMES[deposit.paymentMethod] }, ${ formatInstantDate(deposit.receivedAt) }`,
	} ));

	const first = deposits[0];

	const form = useForm<AllocateFormValues>({
		resolver: zodResolver(allocateFormSchema),
		defaultValues: {
			depositId: first.id,
			amount: String(Math.min(first.unallocatedAmount, payment.outstanding)),
		},
	});

	const { control, register, handleSubmit, setValue, formState: { errors } } = form;

	const [chosenId, typedAmount] = useWatch({ control, name: ['depositId', 'amount'] });

	const chosen = deposits.find((deposit) => deposit.id === chosenId);
	const typed = parseAmount(typedAmount);

	const overCredit = chosen !== undefined && !Number.isNaN(typed) && typed > chosen.unallocatedAmount;

	const onSubmit = handleSubmit((values) => {
		allocate.mutate(
			{
				id: values.depositId,
				payload: { targets: [{ paymentId: payment.id, amount: parseAmount(values.amount) }] },
			},
			{
				onSuccess: () => {
					notifySuccess('Rozliczono z nadpłaty.');
					closeModal();
				},
			},
		);
	});

	const busy = allocate.isPending;

	return (
		<form onSubmit={ onSubmit } noValidate className="space-y-5">
			<Controller
				control={ control }
				name="depositId"
				render={ ({ field }) => (
					<ExtendedSelect
						label="Wybierz wpłatę z wolnymi środkami"
						options={ options }
						value={ field.value === '' ? undefined : field.value }
						onChange={ (id) => {
							field.onChange(id ?? '');

							// The amount was proposed against the previous deposit's credit, which may be a different figure.
							const picked = deposits.find((deposit) => deposit.id === id);

							if (picked !== undefined) {
								setValue('amount', String(Math.min(picked.unallocatedAmount, payment.outstanding)));
							}
						} }
						onBlur={ field.onBlur }
						disabled={ busy }
						error={ errors.depositId?.message }
						searchable={ options.length > 6 }
					/>
				) }
			/>

			<Input
				label="Kwota do rozliczenia z wybranej wpłaty"
				inputMode="decimal"
				autoComplete="off"
				disabled={ busy }
				error={ errors.amount?.message }
				{ ...register('amount') }
			/>

			{ overCredit && (
				<Alert tone="warning" contentClassName="text-sm">
					Ta wpłata ma do wykorzystania tylko { formatCurrency(chosen.unallocatedAmount) }. Wpisz poprawną wartość.
				</Alert>
			) }

			{ allocate.error !== null && <Alert tone="danger">{ allocate.error.message }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
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
					type="submit"
					size="md"
					isLoading={ busy }
					disabled={ overCredit || chosen === undefined }
					leftIcon={ <Wallet size={ 16 }/> }
				>
					Rozlicz z wpłaty
				</Button>
			</div>
		</form>
	);
}
