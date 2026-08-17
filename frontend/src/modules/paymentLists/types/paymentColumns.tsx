import type { AppColumnDef } from '@/components/dataTable';
import { TagBadgeSingle } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { CHARGE_KIND_OPTIONS, CONTRACT_TAG_OPTIONS, PAID_TAG_OPTIONS, type PaymentRow, SETTLE_STATE_OPTIONS, } from './paymentRows.ts';


function moneyColumn(accessorKey: keyof PaymentRow, header: string, summarised: boolean): AppColumnDef<PaymentRow> {
	return {
		accessorKey,
		header,
		fieldType: 'number',
		size: 140,
		aggregationFn: summarised ? 'sum' : undefined,
		cell: ({ getValue }) => <span className="tabular-nums">{ formatCurrency(getValue<number>()) }</span>,
		aggregatedCell: summarised
			? ({ getValue }) => <span className="tabular-nums">{ formatCurrency(getValue<number>()) }</span>
			: () => null,
		meta: {
			globalSearch: true,
			searchText: (value) => formatCurrency(value == null ? '' : String(value)),
		},
	};
}


/**
 * One list's charges, as the table reads them.
 */
export function buildPaymentColumns(tracksContracts: boolean): AppColumnDef<PaymentRow>[] {
	const columns: AppColumnDef<PaymentRow>[] = [
		{
			accessorKey: 'code',
			header: 'Nr',
			fieldType: 'text',
			size: 110,
			sortValue: (row) => row.number,
			meta: { globalSearch: true },
		},
		{
			accessorKey: 'firstName',
			header: 'Imię',
			fieldType: 'text',
			size: 160,
			meta: { globalSearch: true },
		},
		{
			accessorKey: 'lastName',
			header: 'Nazwisko',
			fieldType: 'text',
			size: 180,
			meta: { globalSearch: true },
		},
		{
			accessorKey: 'personName',
			header: 'Osoba',
			fieldType: 'text',
			size: 220,
			meta: { groupable: true, globalSearch: true },
		},
		{
			accessorKey: 'label',
			header: 'Za co',
			fieldType: 'text',
			size: 200,
			meta: { groupable: true, globalSearch: true },
		},
		{
			accessorKey: 'chargeKind',
			header: 'Rodzaj',
			fieldType: 'tag',
			size: 150,
			meta: { groupable: true, globalSearch: false, tagOptions: CHARGE_KIND_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ CHARGE_KIND_OPTIONS }/>,
		},
		{
			accessorKey: 'quantity',
			header: 'Ilość',
			fieldType: 'number',
			size: 100,
			aggregatedCell: () => null,
			meta: { globalSearch: false },
		},
		moneyColumn('unitCost', 'Stawka', false),
		moneyColumn('amountToPay', 'Do zapłaty', true),
		moneyColumn('amountSettled', 'Rozliczono', true),
		moneyColumn('outstanding', 'Pozostało', true),
		{
			accessorKey: 'settleState',
			header: 'Rozliczenie',
			fieldType: 'tag',
			size: 160,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: SETTLE_STATE_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ SETTLE_STATE_OPTIONS }/>,
		},
		{
			accessorKey: 'isPaid',
			header: 'Status płatności',
			fieldType: 'tag',
			size: 170,
			meta: { groupable: true, globalSearch: false, tagOptions: PAID_TAG_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ PAID_TAG_OPTIONS }/>,
		}
	];

	if (tracksContracts) {
		columns.push({
			accessorKey: 'contractReturned',
			header: 'Umowa',
			fieldType: 'tag',
			size: 170,
			meta: { groupable: true, globalSearch: false, tagOptions: CONTRACT_TAG_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ CONTRACT_TAG_OPTIONS }/>,
		});
	}

	return columns;
}
