import type { AppColumnDef } from '@/components/dataTable';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { TagBadgeSingle } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { coveredPersonsSummary, PAYMENT_METHOD_OPTIONS } from '@/types/finance.ts';
import { ALLOCATION_STATE_OPTIONS, DEPOSIT_CODE_PREFIX, type DepositRow, ORIGIN_OPTIONS, SCOPE_OPTIONS, } from './depositRows.ts';


function moneyColumn(accessorKey: keyof DepositRow, header: string): AppColumnDef<DepositRow> {
	return {
		accessorKey,
		header,
		fieldType: 'number',
		size: 140,
		aggregationFn: 'sum',
		cell: ({ getValue }) => <span className="tabular-nums">{ formatCurrency(getValue<number>()) }</span>,
		aggregatedCell: ({ getValue }) => <span className="tabular-nums">{ formatCurrency(getValue<number>()) }</span>,
		meta: {
			globalSearch: true,
			displayFormatter: (value) => formatCurrency(value == null ? '' : String(value)),
		},
	};
}


function spokenCode(value: unknown): string {
	return value == null || value === '' ? '' : `${ DEPOSIT_CODE_PREFIX }${ String(value) }`;
}


export function buildDepositColumns(): AppColumnDef<DepositRow>[] {
	return [
		{
			accessorKey: 'code',
			header: 'Nr',
			fieldType: 'text',
			size: 110,
			sortValue: (row) => row.number,
			meta: { globalSearch: true, searchText: (value) => spokenCode(value) },
		},
		{
			accessorKey: 'coveredNames',
			header: 'Za kogo',
			fieldType: 'text',
			size: 220,
			meta: { groupable: true, globalSearch: true },
			cell: ({ row }) => (
				<span title={ row.original.coveredNames }>{ coveredPersonsSummary(row.original.coveredPersons) }</span>
			),
		},
		moneyColumn('totalAmount', 'Kwota'),
		moneyColumn('allocatedAmount', 'Rozliczono'),
		moneyColumn('unallocatedAmount', 'Nadpłata'),
		{
			accessorKey: 'allocationState',
			header: 'Rozliczenie',
			fieldType: 'tag',
			size: 160,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: ALLOCATION_STATE_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ ALLOCATION_STATE_OPTIONS }/>,
		},
		{
			accessorKey: 'paymentMethod',
			header: 'Forma Płatności',
			fieldType: 'tag',
			size: 170,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: PAYMENT_METHOD_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ PAYMENT_METHOD_OPTIONS }/>,
		},
		{
			accessorKey: 'receivedAt',
			header: 'Data wpłaty',
			fieldType: 'date',
			size: 180,
			aggregatedCell: () => null,
			cell: ({ getValue }) => <span>{ formatInstantDate(getValue<string>()) }</span>,
			meta: { globalSearch: true, displayFormatter: (value) => formatInstantDate(value == null ? '' : String(value)) },
		},
		{
			accessorKey: 'scope',
			header: 'Konto',
			fieldType: 'tag',
			size: 140,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: SCOPE_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ SCOPE_OPTIONS }/>,
		},
		{
			accessorKey: 'origin',
			header: 'Sposób zapisu',
			fieldType: 'tag',
			size: 160,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: ORIGIN_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ ORIGIN_OPTIONS }/>,
		},
		{
			accessorKey: 'coveredCount',
			header: 'Za ile osób',
			fieldType: 'number',
			size: 130,
			aggregatedCell: () => null,
			meta: { globalSearch: false },
		},
		{
			accessorKey: 'note',
			header: 'Notatka',
			fieldType: 'text',
			size: 240,
			aggregatedCell: () => null,
			meta: { globalSearch: true },
		}
	];
}
