import type { GroupingState } from '@tanstack/react-table';
import { cn } from '@/lib/cn';
import { dataTableStrings } from '@/components/dataTable';

export interface GroupableColumn {
	id: string;
	label: string;
}

interface GroupPanelProps {
	columns: GroupableColumn[];
	grouping: GroupingState;
	onChange: (grouping: GroupingState) => void;
	onClose: () => void;
}

/** Grouping is single-level: picking a column replaces whatever was grouped before. */
export const GroupPanel = ({ columns, grouping, onChange, onClose }: GroupPanelProps) => {

	const choose = (next: GroupingState) => {
		onChange(next);
		onClose();
	};

	const optionClass = (selected: boolean) =>
		cn(
			'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors outline-none',
			selected
				? 'bg-os-primary/10 text-os-primary'
				: 'text-os-text hover:bg-os-bg-highlight focus-visible:bg-os-bg-highlight',
		);

	return (
		<div role="radiogroup" className="flex flex-col">
			<button
				type="button"
				role="radio"
				aria-checked={ grouping.length === 0 }
				onClick={ () => choose([]) }
				className={ optionClass(grouping.length === 0) }
			>
				{ dataTableStrings.table.groupNone }
			</button>

			{ columns.map((column) => (
				<button
					key={ column.id }
					type="button"
					role="radio"
					aria-checked={ grouping[0] === column.id }
					onClick={ () => choose([column.id]) }
					className={ optionClass(grouping[0] === column.id) }
				>
					<span className="truncate">{ column.label }</span>
				</button>
			)) }
		</div>
	);
};
