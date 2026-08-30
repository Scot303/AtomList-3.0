import type { AppColumnDef } from '@/components/dataTable';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { TagBadgeOf } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { coveredPersonsSummary, PAYMENT_METHOD_OPTIONS, PAYMENT_METHOD_TAGS } from '@/types/finance.ts';
import { ALLOCATION_STATE_OPTIONS, ALLOCATION_STATE_TAGS, DEPOSIT_CODE_PREFIX, type DepositRow, ORIGIN_OPTIONS, ORIGIN_TAGS, SCOPE_OPTIONS, SCOPE_TAGS, } from './depositRows.ts';


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
			cell: ({ row }) => <TagBadgeOf tag={ ALLOCATION_STATE_TAGS[row.original.allocationState] }/>,
		},
		{
			accessorKey: 'paymentMethod',
			header: 'Forma Płatności',
			fieldType: 'tag',
			size: 170,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: PAYMENT_METHOD_OPTIONS },
			cell: ({ row }) => <TagBadgeOf tag={ PAYMENT_METHOD_TAGS[row.original.paymentMethod] }/>,
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
			cell: ({ row }) => <TagBadgeOf tag={ SCOPE_TAGS[row.original.scope] }/>,
		},
		{
			accessorKey: 'origin',
			header: 'Sposób zapisu',
			fieldType: 'tag',
			size: 160,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: ORIGIN_OPTIONS },
			cell: ({ row }) => <TagBadgeOf tag={ ORIGIN_TAGS[row.original.origin] }/>,
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
