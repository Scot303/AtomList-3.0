import type { MouseEvent } from 'react';
import type { Row } from '@tanstack/react-table';
import type { VirtualItem } from '@tanstack/react-virtual';
import { dataTableStrings } from '@/components/dataTable';
import type { DataTableFeatures } from '../tableFeatures';
import { DataTableGroupRow, DataTableRow } from './DataTableRow';


interface DataTableBodyProps<T extends object> {
	/** Every row that qualifies, not just the rendered ones - indexed into by `virtualRows`. */
	rows: Row<DataTableFeatures, T>[];
	virtualRows: VirtualItem[];
	paddingTop: number;
	paddingBottom: number;
	measureRow: (node: HTMLTableRowElement | null) => void;
	visibleColumnCount: number;
	isLoading: boolean;
	emptyMessage?: string;
	onCellEdit?: (rowId: string, columnId: string, value: unknown) => void;
	onRowClick?: (row: T) => void;
	onRowContextMenu?: (event: MouseEvent, row: T) => void;
	contextRowId: string | null;
	onContextRowChange: (rowId: string) => void;
}


export const DataTableBody = <T extends object>(props: DataTableBodyProps<T>) => {
	const {
		rows, virtualRows, paddingTop, paddingBottom, measureRow,
		visibleColumnCount, isLoading, emptyMessage,
		onCellEdit, onRowClick, onRowContextMenu,
		contextRowId, onContextRowChange,
	} = props;

	if (rows.length === 0) {
		if (isLoading) {
			return null;
		}

		return (
			<tr>
				<td colSpan={ visibleColumnCount } className="py-16 text-center text-os-text-muted">
					{ emptyMessage ?? dataTableStrings.table.noData }
				</td>
			</tr>
		);
	}

	return (
		<>
			{ paddingTop > 0 && <Spacer height={ paddingTop } columnCount={ visibleColumnCount }/> }

			{ virtualRows.map((virtualRow) => {
				const row = rows[virtualRow.index];

				return row.getIsGrouped()
					? (
						<DataTableGroupRow
							key={ row.id }
							row={ row }
							virtualIndex={ virtualRow.index }
							measureRow={ measureRow }
						/>
					)
					: (
						<DataTableRow
							key={ row.id }
							row={ row }
							virtualIndex={ virtualRow.index }
							measureRow={ measureRow }
							onCellEdit={ onCellEdit }
							onRowClick={ onRowClick }
							onRowContextMenu={ onRowContextMenu }
							isContextTarget={ row.id === contextRowId }
							onContextRowChange={ onContextRowChange }
						/>
					);
			}) }

			{ paddingBottom > 0 && <Spacer height={ paddingBottom } columnCount={ visibleColumnCount }/> }
		</>
	);
};

/**
 * Stands in for the rows outside the window, so the scrollbar reflects the whole dataset.
 */
const Spacer = ({ height, columnCount }: { height: number; columnCount: number }) => (
	<tr aria-hidden="true" style={ { height } }>
		<td colSpan={ columnCount } className="p-0"/>
	</tr>
);
