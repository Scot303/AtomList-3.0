import type { AppColumnDef } from '@/components/dataTable';
import { TagBadge, TagBadgeOf } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { resolveGroupColor } from '@/modules/groups/types/groupRows.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { CHARGE_KIND_OPTIONS, CHARGE_KIND_TAGS, CONTRACT_TAG_OPTIONS, CONTRACT_TAGS, type PaymentRow, SETTLE_STATE_OPTIONS, SETTLE_STATE_TAGS, } from './paymentRows.ts';


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
 * What a charge is for, drawn as the group's own badge.
 */
function chargeLabelCell(row: PaymentRow, groupsById: ReadonlyMap<string, GroupView>) {
	const group = row.groupId === null ? undefined : groupsById.get(row.groupId);

	return group === undefined
		? <span className="truncate">{ row.label }</span>
		: <TagBadge label={ group.name } color={ resolveGroupColor(group) }/>;
}


/**
 * One list's charges, as the table reads them.
 */
export function buildPaymentColumns(tracksContracts: boolean, groupsById: ReadonlyMap<string, GroupView>): AppColumnDef<PaymentRow>[] {
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
			accessorKey: 'label',
			header: 'Za co',
			fieldType: 'text',
			size: 200,
			meta: { groupable: true, globalSearch: true },
			cell: ({ row }) => chargeLabelCell(row.original, groupsById),
		},
		{
			accessorKey: 'note',
			header: 'Notatka',
			fieldType: 'text',
			size: 240,
			aggregatedCell: () => null,
			meta: { globalSearch: true },
		},
		{
			accessorKey: 'chargeKind',
			header: 'Rodzaj',
			fieldType: 'tag',
			size: 150,
			meta: { groupable: true, globalSearch: false, tagOptions: CHARGE_KIND_OPTIONS },
			cell: ({ row }) => <TagBadgeOf tag={ CHARGE_KIND_TAGS[row.original.chargeKind] }/>,
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
		moneyColumn('amountSettled', 'Opłacono', true),
		moneyColumn('outstanding', 'Pozostało', true),
		{
			accessorKey: 'settleState',
			header: 'Rozliczenie',
			fieldType: 'tag',
			size: 160,
			meta: { groupable: true, globalSearch: false, tagOptions: SETTLE_STATE_OPTIONS },
			cell: ({ row }) => <TagBadgeOf tag={ SETTLE_STATE_TAGS[row.original.settleState] }/>,
		}
	];

	if (tracksContracts) {
		columns.push({
			accessorKey: 'contractReturned',
			header: 'Umowa',
			fieldType: 'tag',
			size: 170,
			meta: { groupable: true, globalSearch: false, tagOptions: CONTRACT_TAG_OPTIONS },
			cell: ({ row }) => <TagBadgeOf tag={ CONTRACT_TAGS[row.original.contractReturned] }/>,
		});
	}

	return columns;
}
