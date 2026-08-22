import { ArrowLeft, FileQuestion } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { DataTable } from '@/components/dataTable';
import { Button } from '@/components/ui/buttons/Button';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups } from '@/modules/groups/types/groupRows.ts';
import { useContextMenu } from '@/stores/menuStore';
import { paths } from '@/routes/paths';
import { PaymentListToolbar } from './components/PaymentListToolbar.tsx';
import { usePaymentRowMenu } from './hooks/contextMenu/usePaymentRowMenu.ts';
import { usePaymentList } from './hooks/usePaymentLists';
import { usePayments } from './hooks/usePayments';
import { buildPaymentColumns } from './types/paymentColumns.tsx';
import { type PaymentRow, toPaymentRow } from './types/paymentRows.ts';
import type { PaymentListView } from './types/types.ts';


/**
 * Identifies this table's saved layout.
 */
const TABLE_KEY = 'payment-list-payments';
const CAMP_TABLE_KEY = 'payment-list-payments-camp';

const HIDDEN_COLS = {
	quantity: false,
	unitCost: false,
	note: false,
};


export function PaymentListDetailPage() {
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

	return <PaymentsTable list={ list.data }/>;
}


/* ------------------ DATA TABLE ------------------ */

function PaymentsTable({ list }: { list: PaymentListView }) {
	const navigate = useNavigate();
	const openContextMenu = useContextMenu();

	const payments = usePayments(list.id);
	const groups = useGroups();

	const tracksContracts = list.tracksContracts;
	const tableKey = tracksContracts ? CAMP_TABLE_KEY : TABLE_KEY;

	const buildRowMenu = usePaymentRowMenu(list);

	const rows = ( payments.data ?? [] ).map(toPaymentRow);

	const groupsById = indexGroups(groups.data ?? []);
	const columns = buildPaymentColumns(tracksContracts, groupsById);

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
				moduleKey={ tableKey }
				data={ rows }
				columns={ columns }
				getRowId={ (row) => row.id }
				isLoading={ payments.isLoading }
				enableGrouping
				emptyMessage="Brak płatności na tej liście"
				toolbarStart={ toolbarStart }
				toolbar={ <PaymentListToolbar list={ list }/> }
				initialColumnVisibility={ HIDDEN_COLS }
				onRowContextMenu={ (event, row: PaymentRow) => openContextMenu(event, buildRowMenu(row)) }
			/>
		</div>
	);
}


/* ------------------ LIST UNAVAILABLE ------------------ */

interface ListUnavailableProps {
	notFound: boolean;
	message: string;
	onRetry: () => void;
	onBack: () => void;
}


/**
 * The dead end for a list that cannot be shown - usually an id that no longer exists, or was mistyped.
 */
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
