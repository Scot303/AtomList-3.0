import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Textarea, Toggle } from '@/components/ui/fields';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { PaymentIdentity } from '../components/PaymentIdentity';
import { useUpdatePayment } from '../hooks/usePaymentMutations';
import { paymentEditFormSchema, type PaymentEditFormValues } from '../schemas/paymentSchemas';
import type { PaymentView, UpdatePaymentPayload } from '../types/types.ts';


interface PaymentEditModalProps {
	payment: PaymentView;
	/** Camp lists only - the contract toggle has nothing to say on any other kind, and the backend rejects it. */
	tracksContracts: boolean;
}


export default function PaymentEditModal({ payment, tracksContracts }: PaymentEditModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const updatePayment = useUpdatePayment();

	const form = useForm<PaymentEditFormValues>({
		resolver: zodResolver(paymentEditFormSchema),
		defaultValues: {
			note: payment.note ?? '',
			contractReturned: payment.contractReturned,
		},
	});

	const { register, control, handleSubmit, formState: { errors } } = form;

	const onSubmit = handleSubmit((values) => {
		const payload: UpdatePaymentPayload = {};

		if (values.note !== ( payment.note ?? '' )) {
			payload.note = values.note;
		}

		if (tracksContracts && values.contractReturned !== payment.contractReturned) {
			payload.contractReturned = values.contractReturned;
		}

		if (Object.keys(payload).length === 0) {
			closeModal();
			return;
		}

		updatePayment.mutate(
			{ id: payment.id, listId: payment.listId, payload },
			{
				onSuccess: () => {
					notifySuccess('Zapisano zmiany.');
					closeModal();
				},
			},
		);
	});

	const busy = updatePayment.isPending;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-3 space-y-5">
			<header className="styled-card p-3 rounded-2xl mb-8">
				<PaymentIdentity payment={ payment }/>
			</header>

			{ tracksContracts && (
				<div className="styled-card rounded-xl px-3 py-1">
					<Controller
						control={ control }
						name="contractReturned"
						render={ ({ field }) => (
							<Toggle
								label="Umowa zwrócona"
								description="Podpisana umowa została zwrócona do studia."
								checked={ field.value }
								onChange={ field.onChange }
								disabled={ busy }
								compact
							/>
						) }
					/>
				</div>
			) }

			<Textarea
				label="Notatka"
				maxLength={ 512 }
				minRows={ 5 }
				autoFocus
				disabled={ busy }
				error={ errors.note?.message }
				{ ...register('note') }
			/>

			{ updatePayment.error !== null && <Alert tone="danger">{ updatePayment.error.message }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
					Anuluj
				</Button>

				<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Save size={ 16 }/> }>
					Zapisz
				</Button>
			</div>
		</form>
	);
}
