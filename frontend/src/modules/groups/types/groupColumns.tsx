import type { AppColumnDef } from '@/components/dataTable';
import { TagBadge, TagBadgeOf } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { ACTIVE_TAG_OPTIONS, ACTIVE_TAGS } from '@/types/rowTags.ts';
import { BILLING_TYPE_OPTIONS, BILLING_TYPE_TAGS, GROUP_TYPE_OPTIONS, GROUP_TYPE_TAGS, type GroupRow } from './groupRows.ts';


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
			accessorKey: 'type',
			header: 'Rodzaj grupy',
			fieldType: 'tag',
			size: 180,
			meta: { groupable: true, tagOptions: GROUP_TYPE_OPTIONS, globalSearch: false },
			cell: ({ row }) => <TagBadgeOf tag={ GROUP_TYPE_TAGS[row.original.type] }/>,
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
			cell: ({ row }) => <TagBadgeOf tag={ BILLING_TYPE_TAGS[row.original.billingType] }/>,
		},
		{
			accessorKey: 'activeTag',
			header: 'Status grupy',
			fieldType: 'tag',
			size: 170,
			meta: { editable: true, groupable: true, tagOptions: ACTIVE_TAG_OPTIONS, globalSearch: false },
			cell: ({ row }) => <TagBadgeOf tag={ ACTIVE_TAGS[row.original.activeTag] }/>,
		},
	];
}
