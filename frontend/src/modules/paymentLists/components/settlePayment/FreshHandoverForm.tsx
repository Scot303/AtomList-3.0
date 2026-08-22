import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { DatePicker, Input, Textarea } from '@/components/ui/fields';
import { dateToISO, todayInTimeZone } from '@/utils/dateUtils.ts';
import { TagSelect } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { useSettlePayment } from '../../hooks/usePaymentMutations';
import { optionalText, parseAmount, settleFormSchema, type SettleFormValues, toInstant } from '../../schemas/paymentSchemas';
import { PAYMENT_METHOD_OPTIONS } from '@/types/finance.ts';
import type { PaymentView } from '../../types/types.ts';


/**
 * Money arriving now, recorded as a handover of its own.
 */
export function FreshHandoverForm({ payment }: { payment: PaymentView }) {
	const closeModal = useModalStore((state) => state.closeModal);

	const settle = useSettlePayment();

	const form = useForm<SettleFormValues>({
		resolver: zodResolver(settleFormSchema),
		defaultValues: {
			amount: String(payment.outstanding),
			paymentMethod: 'TRANSFER',
			receivedAt: dateToISO(todayInTimeZone()),
			note: '',
		},
	});

	const { register, control, handleSubmit, formState: { errors } } = form;

	const onSubmit = handleSubmit((values) => {
		settle.mutate(
			{
				id: payment.id,
				listId: payment.listId,
				payload: {
					amount: parseAmount(values.amount),
					paymentMethod: values.paymentMethod,
					note: optionalText(values.note),
					receivedAt: toInstant(values.receivedAt),
				},
			},
			{
				onSuccess: (updated) => {
					notifySuccess(updated.settled ? 'Płatność została rozliczona.' : 'Zapisano wpłatę częściową.');
					closeModal();
				},
			},
		);
	});

	const busy = settle.isPending;

	return (
		<form onSubmit={ onSubmit } noValidate className="flex min-h-0 flex-1 flex-col">
			<div className="space-y-5">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Input
						label="Wpłacana kwota"
						inputMode="decimal"
						autoComplete="off"
						disabled={ busy }
						error={ errors.amount?.message }
						hint={ `Pozostało: ${ formatCurrency(payment.outstanding) }` }
						{ ...register('amount') }
					/>

					<Controller
						control={ control }
						name="paymentMethod"
						render={ ({ field }) => (
							<TagSelect
								label="Forma płatności"
								options={ PAYMENT_METHOD_OPTIONS }
								value={ field.value }
								onChange={ (id) => {
									if (id !== undefined) {
										field.onChange(id);
									}
								} }
								onBlur={ field.onBlur }
								disabled={ busy }
								searchable={ false }
								error={ errors.paymentMethod?.message }
							/>
						) }
					/>
				</div>

				<Controller
					control={ control }
					name="receivedAt"
					render={ ({ field }) => (
						<DatePicker
							label="Data otrzymania wpłaty"
							value={ field.value }
							onChange={ field.onChange }
							onBlur={ field.onBlur }
							disabled={ busy }
							error={ errors.receivedAt?.message }
							hint="Decyduje o miesiącu księgowania"
						/>
					) }
				/>

				<Textarea
					label="Notatka"
					maxLength={ 512 }
					minRows={ 2 }
					disabled={ busy }
					error={ errors.note?.message }
					{ ...register('note') }
				/>

				{ settle.error !== null && <Alert tone="danger">{ settle.error.message }</Alert> }
			</div>

			<div className="mt-auto flex shrink-0 justify-end gap-3 pt-5">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
					Anuluj
				</Button>

				<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Wallet size={ 16 }/> }>
					Zapisz wpłatę
				</Button>
			</div>
		</form>
	);
}
