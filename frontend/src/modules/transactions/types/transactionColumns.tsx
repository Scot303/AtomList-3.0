import type { ReactNode } from 'react';
import type { AppColumnDef } from '@/components/dataTable';
import { TagBadgeOf } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { formatLongDate } from '@/utils/dateUtils.ts';
import { CellPlaceholder } from '@/components/dataTable/cells/CellPlaceholder';
import { TRANSACTION_TYPE_OPTIONS, TRANSACTION_TYPE_TAGS, type TransactionRow } from './transactionRows.ts';


function money(value: unknown): string {
	return formatCurrency(value == null ? '' : String(value));
}


function renderDate(value: string): ReactNode {
	const display = formatLongDate(value);

	return display === '' ? <CellPlaceholder/> : display;
}


export function buildTransactionColumns(editable: boolean): AppColumnDef<TransactionRow>[] {
	return [
		{
			accessorKey: 'paymentDate',
			header: 'Data płatności',
			fieldType: 'date',
			size: 180,
			aggregatedCell: () => null,
			cell: ({ getValue }) => renderDate(getValue<string>()),
			meta: {
				globalSearch: true,
				displayFormatter: (value) => formatLongDate(value == null ? '' : String(value)),
			},
		},
		{
			accessorKey: 'name',
			header: 'Nazwa',
			fieldType: 'text',
			size: 380,
			meta: { globalSearch: true },
		},
		{
			accessorKey: 'amount',
			header: 'Kwota',
			fieldType: 'number',
			size: 150,
			aggregatedCell: () => null,
			meta: {
				editable,
				globalSearch: true,
				displayFormatter: money,
			},
		},
		{
			accessorKey: 'quantity',
			header: 'Ilość',
			fieldType: 'number',
			size: 120,
			aggregatedCell: () => null,
			meta: { editable, globalSearch: false },
		},
		{
			accessorKey: 'total',
			header: 'Razem',
			fieldType: 'number',
			size: 150,
			aggregationFn: 'sum',
			cell: ({ getValue }) => <span className="tabular-nums">{ money(getValue<number>()) }</span>,
			aggregatedCell: ({ getValue }) => <span className="tabular-nums">{ money(getValue<number>()) }</span>,
			meta: {
				globalSearch: true,
				searchText: money,
			},
		},
		{
			accessorKey: 'invoiceNumber',
			header: 'Nr faktury',
			fieldType: 'text',
			size: 170,
			aggregatedCell: () => null,
			meta: { editable, globalSearch: true },
		},
		{
			accessorKey: 'note',
			header: 'Notatka',
			fieldType: 'text',
			size: 280,
			aggregatedCell: () => null,
			meta: { globalSearch: true },
		},
		{
			accessorKey: 'type',
			header: 'Rodzaj',
			fieldType: 'tag',
			size: 130,
			meta: { groupable: true, globalSearch: false, tagOptions: TRANSACTION_TYPE_OPTIONS },
			cell: ({ row }) => <TagBadgeOf tag={ TRANSACTION_TYPE_TAGS[row.original.type] }/>,
		},
	];
}
