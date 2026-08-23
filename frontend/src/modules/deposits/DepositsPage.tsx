import { useState } from 'react';
import { DataTable } from '@/components/dataTable';
import { todayInTimeZone } from '@/utils/dateUtils.ts';
import { useContextMenu } from '@/stores/menuStore';
import { DepositsToolbar } from './components/DepositsToolbar.tsx';
import { useDeposits } from './hooks/useDeposits';
import { useDepositRowMenu } from './hooks/useDepositRowMenu';
import { buildDepositColumns } from './types/depositColumns.tsx';
import { type DepositRow, toDepositRow } from './types/depositRows.ts';


/**
 * Identifies this table's saved layout.
 */
const TABLE_KEY = 'deposits';


const HIDDEN_COLS = {
	origin: false,
	coveredCount: false,
	note: false,
};


export function DepositsPage() {
	const [year, setYear] = useState(() => todayInTimeZone().getFullYear());
	const [allYears, setAllYears] = useState(false);

	const openContextMenu = useContextMenu();

	const deposits = useDeposits(allYears ? null : year);

	const buildRowMenu = useDepositRowMenu();

	const rows = ( deposits.data ?? [] ).map(toDepositRow);
	const columns = buildDepositColumns();

	const toolbar = (
		<DepositsToolbar
			year={ year }
			allYears={ allYears }
			onYearChange={ setYear }
			onAllYearsChange={ setAllYears }
		/>
	);

	return (
		<div className="styled-card table-page">
			<DataTable
				moduleKey={ TABLE_KEY }
				data={ rows }
				columns={ columns }
				getRowId={ (row) => row.id }
				isLoading={ deposits.isLoading }
				enableGrouping
				emptyMessage={ allYears ? 'Nie zapisano jeszcze żadnej wpłaty' : `Brak wpłat przyjętych w roku ${ year }` }
				toolbar={ toolbar }
				initialColumnVisibility={ HIDDEN_COLS }
				onRowContextMenu={ (event, row: DepositRow) => openContextMenu(event, buildRowMenu(row)) }
			/>
		</div>
	);
}
