import { ArrowLeft, FileQuestion } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { DataTable, useTableFilterTags } from '@/components/dataTable';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { Button } from '@/components/ui/buttons/Button';
import { notifyApiError } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { usePaymentList } from '@/modules/paymentLists/hooks/queries/usePaymentLists.ts';
import type { PaymentListView } from '@/modules/paymentLists/types/types.ts';
import { paths } from '@/routes/paths';
import { useContextMenu } from '@/stores/menuStore';
import { TransactionsToolbar } from './components/TransactionsToolbar.tsx';
import { useTransactionRowMenu } from './hooks/contextMenu/useTransactionRowMenu.ts';
import { useUpdateTransaction } from './hooks/mutations/useTransactionMutations.ts';
import { useTransactions } from './hooks/queries/useTransactions.ts';
import { buildTransactionColumns } from './types/transactionColumns.tsx';
import { toTransactionRow, type TransactionRow } from './types/transactionRows.ts';
import { shownTransactionType } from './utils/typeFilter.ts';
import type { UpdateTransactionPayload } from './types/types.ts';


const TABLE_KEY = 'payment-list-transactions';

const HIDDEN_COLS = {
	type: false,
};


export function TransactionsPage() {
	const { listId = '' } = useParams();
	const navigate = useNavigate();

	const list = usePaymentList(listId);

	if (list.isPending) {
		return (
			<div className="styled-card table-page flex items-center justify-center">
				<FullPageLoader/>
			</div>
		);
	}

	if (list.isError) {
		return (
			<ListUnavailable
				notFound={ list.error.status === 404 }
				message={ list.error.message }
				onRetry={ () => void list.refetch() }
				onBack={ () => void navigate(paths.paymentLists) }
			/>
		);
	}

	return <TransactionsTable list={ list.data }/>;
}


/* ------------------ DATA TABLE ------------------ */

function TransactionsTable({ list }: { list: PaymentListView }) {
	const navigate = useNavigate();
	const openContextMenu = useContextMenu();
	const { hasPermission } = useAuth();

	const transactions = useTransactions(list.id);
	const updateTransaction = useUpdateTransaction();

	const filterTags = useTableFilterTags(TABLE_KEY);

	const buildRowMenu = useTransactionRowMenu(list);

	const rows = ( transactions.data ?? [] ).map(toTransactionRow);

	const canEdit = ( hasPermission('MODIFY_INCOME_TRANSACTIONS') || hasPermission('MODIFY_EXPENSE_TRANSACTIONS') ) && !list.closed;

	const columns = buildTransactionColumns(canEdit);

	const handleCellEdit = (rowId: string, columnId: string, value: unknown) => {
		const payload = toUpdatePayload(columnId, value);

		if (payload === null) {
			return;
		}

		updateTransaction.mutate(
			{
				id: rowId,
				listId: list.id,
				payload
			},
			{ onError: notifyApiError }
		);
	};

	const toolbarStart = (
		<div className="mr-4 flex shrink-0 items-center">
			<Button
				variant="ghost_primary"
				size="md"
				className="py-1.5"
				leftIcon={ <ArrowLeft size={ 14 }/> }
				onClick={ () => void navigate(paths.paymentLists) }
			>
				Powrót
			</Button>
		</div>
	);

	return (
		<div className="styled-card table-page">
			<DataTable
				moduleKey={ TABLE_KEY }
				data={ rows }
				columns={ columns }
				getRowId={ (row) => row.id }
				isLoading={ transactions.isLoading }
				enableGrouping
				emptyMessage="Brak dodatkowych przychodów i wydatków na tej liście"
				initialColumnVisibility={ HIDDEN_COLS }
				onCellEdit={ canEdit ? handleCellEdit : undefined }
				onRowContextMenu={ (event, row: TransactionRow) => openContextMenu(event, buildRowMenu(row)) }
				toolbarStart={ toolbarStart }
				toolbar={
					<TransactionsToolbar
						list={ list }
						tags={ filterTags }
						shownType={ shownTransactionType(filterTags) }
					/>
				}
			/>
		</div>
	);
}


function toUpdatePayload(columnId: string, value: unknown): UpdateTransactionPayload | null {
	switch (columnId) {
		case 'amount':
		case 'quantity': {
			if (value === null || value === '') {
				return null;
			}

			const figure = Number(value);

			return Number.isNaN(figure) || figure < 0 ? null : { [columnId]: figure };
		}

		case 'invoiceNumber':
			return { invoiceNumber: String(value ?? '').trim() };

		default:
			return null;
	}
}


/* ------------------ LIST UNAVAILABLE ------------------ */

interface ListUnavailableProps {
	notFound: boolean;
	message: string;
	onRetry: () => void;
	onBack: () => void;
}


function ListUnavailable({ notFound, message, onRetry, onBack }: ListUnavailableProps) {
	return (
		<div className="styled-card table-page flex items-center justify-center">
			<div className="flex max-w-lg flex-col items-center gap-4 px-6 py-14 text-center">
				<FileQuestion className="size-10 text-os-error"/>

				<div>
					<h2 className="text-xl font-bold text-os-text">
						{ notFound ? 'Nie znaleziono listy' : 'Nie udało się wczytać listy' }
					</h2>
					<p className="mt-3 text-base text-os-text">
						{ notFound ? 'Lista mogła zostać usunięta, albo adres jest nieprawidłowy.' : message }
					</p>
				</div>

				<div className="mt-2 flex flex-wrap items-center justify-center gap-5">
					{ !notFound && (
						<Button className="w-45" onClick={ onRetry }>
							Spróbuj ponownie
						</Button>
					) }

					<Button variant="secondary" className="w-45" onClick={ onBack }>
						Wróć do wyboru list
					</Button>
				</div>
			</div>
		</div>
	);
}
