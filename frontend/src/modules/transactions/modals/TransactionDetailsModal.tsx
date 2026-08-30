import { zodResolver } from '@hookform/resolvers/zod';
import { Save, UserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { TagBadgeOf } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useModalStore } from '@/stores/modalStore';
import { TransactionFormFields } from '../components/TransactionFormFields.tsx';
import { useUpdateTransaction } from '../hooks/mutations/useTransactionMutations.ts';
import { useTransactions } from '../hooks/queries/useTransactions.ts';
import { parseAmount, transactionFormSchema, type TransactionFormValues } from '../schemas/transactionSchemas.ts';
import { TRANSACTION_TYPE_TAGS, transactionName } from '../types/transactionRows.ts';
import type { TransactionType, TransactionView, UpdateTransactionPayload } from '../types/types.ts';


interface TransactionDetailsModalProps {
	listId: string;
	transactionId: string;
	listClosed: boolean;
}


export default function TransactionDetailsModal({ listId, transactionId, listClosed }: TransactionDetailsModalProps) {
	const transactions = useTransactions(listId);

	if (transactions.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (transactions.isError) {
		return <Alert tone="danger">{ transactions.error.message }</Alert>;
	}

	const transaction = transactions.data.find((candidate) => candidate.id === transactionId);

	if (transaction === undefined) {
		return <Alert tone="warning">Ta pozycja została już usunięta z listy.</Alert>;
	}

	return <Details key={ transaction.id } transaction={ transaction } listClosed={ listClosed }/>;
}


function Details({ transaction, listClosed }: { transaction: TransactionView; listClosed: boolean }) {
	const closeModal = useModalStore((state) => state.closeModal);
	const { hasPermission } = useAuth();

	const updateTransaction = useUpdateTransaction();

	const editable = hasPermission(modifyPermission(transaction.type)) && !listClosed;

	const form = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionFormSchema),
		defaultValues: {
			name: transactionName(transaction),
			type: transaction.type,
			amount: String(transaction.amount),
			quantity: String(transaction.quantity),
			invoiceNumber: transaction.invoiceNumber ?? '',
			paymentDate: transaction.paymentDate ?? '',
			instructorId: transaction.instructorId ?? '',
			note: transaction.note ?? '',
		},
	});

	const { control, handleSubmit } = form;

	const onSubmit = handleSubmit((values) => {
		const payload: UpdateTransactionPayload = {
			name: values.name.trim(),
			amount: parseAmount(values.amount),
			quantity: parseAmount(values.quantity),
			invoiceNumber: values.invoiceNumber.trim(),
			note: values.note.trim(),
			...( values.paymentDate === '' ? {} : { paymentDate: values.paymentDate } ),
		};

		updateTransaction.mutate(
			{ id: transaction.id, listId: transaction.listId, payload },
			{
				onSuccess: () => {
					notifySuccess('Zapisano zmiany.');
					closeModal();
				},
			},
		);
	});

	const busy = updateTransaction.isPending;

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-2 space-y-5">
			<header className="styled-card mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3">
				<div className="flex flex-wrap items-center gap-3">
					<TagBadgeOf tag={ TRANSACTION_TYPE_TAGS[transaction.type] }/>

					{ transaction.instructorName !== null && (
						<span className="flex items-center gap-1.5 text-sm text-os-text-muted">
							<UserRound size={ 14 }/>
							{ transaction.instructorName }
						</span>
					) }
				</div>

				<span className="text-sm font-medium tabular-nums">
					<span className="text-os-text-muted">Razem:</span>{ ' ' }
					<span className="text-os-test">{ formatCurrency(transaction.total) }</span>
				</span>
			</header>

			<TransactionFormFields control={ control } disabled={ busy || !editable }/>

			{ !editable && (
				<Alert tone="info">
					{ listClosed
						? 'Lista jest zamknięta, więc tej pozycji nie można już edytować.'
						: 'Twoje konto nie ma uprawnień do zmiany tej pozycji.' }
				</Alert>
			) }

			{ updateTransaction.error !== null && <Alert tone="danger">{ updateTransaction.error.message }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
				<Button type="button" variant="secondary_muted" size="md" disabled={ busy } onClick={ closeModal }>
					{ editable ? 'Anuluj' : 'Zamknij' }
				</Button>

				{ editable && (
					<Button type="submit" size="md" isLoading={ busy } leftIcon={ <Save size={ 16 }/> }>
						Zapisz
					</Button>
				) }
			</div>
		</form>
	);
}


function modifyPermission(type: TransactionType) {
	return type === 'INCOME' ? 'MODIFY_INCOME_TRANSACTIONS' as const : 'MODIFY_EXPENSE_TRANSACTIONS' as const;
}
