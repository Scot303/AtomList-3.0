import { dataTableStrings } from '@/components/dataTable';

/** Stands in for a cell with nothing in it, so an empty row still reads as a row. */
export const CellPlaceholder = () => (
	<span className="text-xs italic text-os-text-muted">{ dataTableStrings.cell.empty }</span>
);
