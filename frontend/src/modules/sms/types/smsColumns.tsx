import type { AppColumnDef } from '@/components/dataTable';
import { TagBadgeSingle } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { formatPhone } from '@/modules/persons/utils/personFormat';
import { formatInstantDateTime } from '@/utils/dateUtils.ts';
import { RECIPIENT_KIND_OPTIONS, type SmsRow } from './smsRows.ts';


export function buildSmsColumns(): AppColumnDef<SmsRow>[] {
	return [
		{
			accessorKey: 'createdAt',
			header: 'Wysłano',
			fieldType: 'date',
			size: 210,
			aggregatedCell: () => null,
			cell: ({ getValue }) => <span>{ formatInstantDateTime(getValue<string>()) }</span>,
			meta: {
				globalSearch: true,
				displayFormatter: (value) => formatInstantDateTime(value == null ? '' : String(value)),
			},
		},
		{
			accessorKey: 'recipientName',
			header: 'Odbiorca',
			fieldType: 'text',
			size: 220,
			meta: { groupable: true, globalSearch: true },
		},
		{
			accessorKey: 'recipientKind',
			header: 'Rodzaj odbiorcy',
			fieldType: 'tag',
			size: 170,
			aggregatedCell: () => null,
			meta: { groupable: true, globalSearch: false, tagOptions: RECIPIENT_KIND_OPTIONS },
			cell: ({ getValue }) => <TagBadgeSingle id={ getValue<string>() } options={ RECIPIENT_KIND_OPTIONS }/>,
		},
		{
			accessorKey: 'sentToPhone',
			header: 'Numer',
			fieldType: 'text',
			size: 150,
			aggregatedCell: () => null,
			cell: ({ getValue }) => <span className="tabular-nums">{ formatPhone(getValue<string>()) }</span>,
			meta: { globalSearch: true, searchText: (value) => formatPhone(value == null ? '' : String(value)) },
		},
		{
			accessorKey: 'message',
			header: 'Treść',
			fieldType: 'text',
			size: 650,
			aggregatedCell: () => null,
			cell: ({ getValue }) => {
				const message = getValue<string>();

				return (
					<Tooltip content={ message } focusable={ false } className="w-full min-w-0">
						<span className="block min-w-0 flex-1 truncate">{ message }</span>
					</Tooltip>
				);
			},
			meta: { globalSearch: true },
		},
		{
			accessorKey: 'length',
			header: 'Znaki',
			fieldType: 'number',
			size: 100,
			aggregatedCell: () => null,
			meta: { globalSearch: false },
		},
		{
			accessorKey: 'segments',
			header: 'Ilość w SMS',
			fieldType: 'number',
			size: 150,
			aggregationFn: 'sum',
			aggregatedCell: ({ getValue }) => <span className="tabular-nums">{ getValue<number>() }</span>,
			meta: { globalSearch: false },
		},
	];
}
