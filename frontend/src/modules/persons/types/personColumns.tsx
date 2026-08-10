import type { AppColumnDef } from '@/components/dataTable';
import type { TagOption } from '@/components/ui/tags';
import { TagBadgeList } from '../../../components/ui/tags/TagBadgeList.tsx';
import { formatAge } from '../utils/personFormat';
import { ACTIVE_TAG_OPTIONS, GROUP_KIND_OPTIONS, type PersonRow } from './personRows.ts';

/**
 * The persons table's columns.
 */
export function buildPersonColumns(groupOptions: TagOption[]): AppColumnDef<PersonRow>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Imię',
			fieldType: 'text',
			size: 160,
			meta: {
				editable: true,
				globalSearch: true
			},
		},
		{
			accessorKey: 'lastName',
			header: 'Nazwisko',
			fieldType: 'text',
			size: 180,
			meta: {
				editable: true,
				globalSearch: true
			},
		},
		{
			accessorKey: 'dateOfBirth',
			header: 'Wiek',
			fieldType: 'date',
			size: 200,
			meta: {
				editable: true,
				displayFormatter: (value) => formatAge(value == null ? '' : String(value)),
				// Both halves of "23 lata · 12.03.2002" are matched, through the formatter.
				globalSearch: true,
			},
		},
		{
			accessorKey: 'contractSigned',
			header: 'Umowa',
			fieldType: 'boolean',
			size: 110,
			meta: { editable: true },
		},
		{
			accessorKey: 'groupIds',
			header: 'Grupy',
			fieldType: 'tag',
			size: 320,
			meta: {
				multiTag: true,
				tagOptions: groupOptions,
				globalSearch: true,
			},
			cell: ({ getValue }) => <TagBadgeList ids={ getValue<string[]>() } options={ groupOptions }/>,
		},
		{
			accessorKey: 'groupKinds',
			header: 'Rodzaj grup',
			fieldType: 'tag',
			size: 150,
			/** What the OPEN and TURNIEJOWI buttons filter on. */
			meta: { multiTag: true, tagOptions: GROUP_KIND_OPTIONS, globalSearch: true },
			cell: ({ getValue }) => <TagBadgeList ids={ getValue<string[]>() } options={ GROUP_KIND_OPTIONS }/>,
		},
		{
			accessorKey: 'activeTag',
			header: 'Status Osoby',
			fieldType: 'tag',
			size: 160,
			meta: { editable: true, groupable: true, tagOptions: ACTIVE_TAG_OPTIONS, globalSearch: true },
		}
	];
}
