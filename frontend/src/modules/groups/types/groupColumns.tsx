import type { AppColumnDef } from '@/components/dataTable';
import { TagBadge, TagBadgeSingle } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { ACTIVE_TAG_OPTIONS } from '@/types/rowTags.ts';
import { BILLING_TYPE_OPTIONS, GROUP_KIND_OPTIONS, type GroupRow } from './groupRows.ts';


/**
 * The groups table's columns.
 */
export function buildGroupColumns(): AppColumnDef<GroupRow>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Nazwa',
			fieldType: 'text',
			size: 260,
			meta: { globalSearch: true },
			cell: ({ row, getValue }) => <TagBadge label={ getValue<string>() } color={ row.original.color }/>,
		},
		{
			accessorKey: 'kind',
			header: 'Rodzaj grupy',
			fieldType: 'tag',
			size: 180,
			meta: { groupable: true, tagOptions: GROUP_KIND_OPTIONS, globalSearch: false },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ GROUP_KIND_OPTIONS }/>,
		},
		{
			accessorKey: 'costForAttending',
			header: 'Koszt',
			fieldType: 'number',
			size: 150,
			aggregatedCell: () => null,
			meta: {
				editable: true,
				globalSearch: true,
				displayFormatter: (value) => formatCurrency(value == null ? '' : String(value)),
			},
		},
		{
			accessorKey: 'billingType',
			header: 'Rozliczenie',
			fieldType: 'tag',
			size: 180,
			meta: { groupable: true, tagOptions: BILLING_TYPE_OPTIONS, globalSearch: false },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ BILLING_TYPE_OPTIONS }/>,
		},
		{
			accessorKey: 'activeTag',
			header: 'Status grupy',
			fieldType: 'tag',
			size: 170,
			meta: { editable: true, groupable: true, tagOptions: ACTIVE_TAG_OPTIONS, globalSearch: false },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ ACTIVE_TAG_OPTIONS }/>,
		},
	];
}
