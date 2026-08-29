import type { ReactNode } from 'react';
import type { AppColumnDef } from '@/components/dataTable';
import { CellPlaceholder } from '@/components/dataTable/cells/CellPlaceholder';
import { TagBadgeSingle } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { formatShortDate } from '@/modules/persons/utils/personFormat.ts';
import { CONTRACT_TYPE_OPTIONS, INSTRUCTOR_ACTIVE_TAG_OPTIONS, type InstructorRow } from './instructorRows.ts';


function money(value: unknown): string {
	return formatCurrency(value == null ? '' : String(value));
}


function renderDate(value: string): ReactNode {
	const display = formatShortDate(value);

	return display === '' ? <CellPlaceholder/> : display;
}


export function buildInstructorColumns(editable: boolean): AppColumnDef<InstructorRow>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Imię',
			fieldType: 'text',
			size: 170,
			meta: { editable, globalSearch: true },
		},
		{
			accessorKey: 'lastName',
			header: 'Nazwisko',
			fieldType: 'text',
			size: 190,
			meta: { editable, globalSearch: true },
		},
		{
			accessorKey: 'costPerHour',
			header: 'Stawka',
			fieldType: 'number',
			size: 140,
			aggregatedCell: () => null,
			meta: {
				editable,
				globalSearch: true,
				displayFormatter: money,
			},
		},
		{
			accessorKey: 'contractType',
			header: 'Rodzaj umowy',
			fieldType: 'tag',
			size: 180,
			meta: { editable, groupable: true, tagOptions: CONTRACT_TYPE_OPTIONS, globalSearch: false, clearable: false },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ CONTRACT_TYPE_OPTIONS }/>,
		},
		{
			accessorKey: 'contractNumber',
			header: 'Nr umowy',
			fieldType: 'text',
			size: 170,
			aggregatedCell: () => null,
			meta: { editable, globalSearch: true },
		},
		{
			accessorKey: 'contractSignedDate',
			header: 'Data podpisania',
			fieldType: 'date',
			size: 190,
			aggregatedCell: () => null,
			meta: {
				editable,
				globalSearch: true,
				displayFormatter: (value) => formatShortDate(value == null ? '' : String(value)),
			},
			cell: ({ getValue }) => renderDate(getValue<string>()),
		},
		{
			accessorKey: 'activeTag',
			header: 'Status instruktora',
			fieldType: 'tag',
			size: 200,
			meta: { editable, groupable: true, tagOptions: INSTRUCTOR_ACTIVE_TAG_OPTIONS, globalSearch: false, clearable: false },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ INSTRUCTOR_ACTIVE_TAG_OPTIONS }/>,
		},
		{
			accessorKey: 'note',
			header: 'Notatka',
			fieldType: 'text',
			size: 300,
			aggregatedCell: () => null,
			meta: { globalSearch: true },
		},
	];
}
