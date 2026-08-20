import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/fields';
import { TagBadge } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows';
import { useModalStore } from '@/stores/modalStore';
import { useUpdateQuantity } from '../hooks/usePaymentMutations';
import { parseAmount, quantityFormSchema, type QuantityFormValues } from '../schemas/paymentSchemas';
import type { PaymentView } from '../types/types.ts';


interface QuantityModalProps {
	payment: PaymentView;
}


/**
 * How many classes somebody attended, for a group billed by the class.
 *
 * Changing it rewrites the amount owed, so the figure the new count would produce is shown before it is saved -
 * and the backend refuses to drop the charge below what has already been paid towards it.
 */
export default function QuantityModal({ payment }: QuantityModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);

	const updateQuantity = useUpdateQuantity();
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);
	const group = payment.groupId === null ? undefined : groupsById.get(payment.groupId);

	const form = useForm<QuantityFormValues>({
		resolver: zodResolver(quantityFormSchema),
		defaultValues: { quantity: String(Number(payment.quantity.toFixed(2))) },
	});

	const { register, control, handleSubmit, formState: { errors } } = form;

	const parsed = parseAmount(useWatch({ control, name: 'quantity' }));

	/** What the charge would come to, worked out the way the backend does: rate times count, less the same discount. */
	const projected = Number.isNaN(parsed)
		? null
		: Math.max(0, payment.unitCost * parsed * ( 1 - payment.discountPercent / 100 ));

	const onSubmit = handleSubmit((values) => {
		updateQuantity.mutate(
			{ id: payment.id, listId: payment.listId, payload: { quantity: parseAmount(values.quantity) } },
			{
				onSuccess: () => {
					notifySuccess('Zapisano nową ilość.');
					closeModal();
				},
			},
		);
	});

	const busy = updateQuantity.isPending;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-3 space-y-5">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-base text-os-text">
						{ payment.personName }
					</p>
					<p className="text-sm text-os-text-muted">
						{ payment.code }
					</p>
				</div>
				{ group !== undefined ? (
					<div className="mt-0.5">
						<TagBadge label={ group.name } color={ resolveGroupColor(group) }/>
					</div>
				) : (
					<p className="text-sm text-os-text-muted">{ payment.description }</p>
				) }
			</div>

			<Input
				label="Liczba wejść"
				type="number"
				autoComplete="off"
				autoFocus
				disabled={ busy }
				error={ errors.quantity?.message }
				hint={ `Stawka za wejście: ${ formatCurrency(payment.unitCost) }` }
				{ ...register('quantity') }
			/>

			{ projected !== null && (
				<Alert tone={ projected < payment.amountSettled ? 'warning' : 'info' }>
					{ projected < payment.amountSettled ? (
						<>
							Po zmianie pozycja wyniesie { formatCurrency(projected) }, a wpłacono już
							{ ' ' }{ formatCurrency(payment.amountSettled) }. Najpierw wycofaj obecne rozliczenie.
						</>
					) : (
						<>Do zapłaty po zmianie: <strong>{ formatCurrency(projected) }</strong></>
					) }
				</Alert>
			) }

			{ updateQuantity.error !== null && <Alert tone="danger">{ updateQuantity.error.message }</Alert> }

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
