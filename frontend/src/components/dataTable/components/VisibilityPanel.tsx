import { Eye, EyeOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dataTableStrings } from '@/components/dataTable';

export interface VisibilityColumn {
	id: string;
	label: string;
	visible: boolean;
	toggle: () => void;
}

interface VisibilityPanelProps {
	columns: VisibilityColumn[];
	/** Forgets the saved layout for this table: order, widths, and hidden columns all go back. */
	onResetLayout: () => void;
	onClose: () => void;
}

export const VisibilityPanel = ({ columns, onResetLayout, onClose }: VisibilityPanelProps) => (
	<div role="group" className="flex flex-col">
		{ columns.map((column) => (
			<button
				key={ column.id }
				type="button"
				role="switch"
				aria-checked={ column.visible }
				onClick={ column.toggle }
				className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-os-bg-highlight focus-visible:bg-os-bg-highlight"
			>
				{ column.visible
					? <Eye size={ 14 } className="shrink-0 text-os-primary"/>
					: <EyeOff size={ 14 } className="shrink-0 text-os-text-muted"/>
				}
				<span className={ cn('truncate', column.visible ? 'text-os-text' : 'text-os-text-muted') }>
					{ column.label }
				</span>
			</button>
		)) }

		<button
			type="button"
			onClick={ () => {
				onResetLayout();
				onClose();
			} }
			className="mt-1 flex w-full items-center gap-2 border-t border-os-border px-2 pb-0.5 pt-2 text-left text-sm text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:text-os-text"
		>
			<RotateCcw size={ 14 } className="shrink-0"/>
			{ dataTableStrings.table.resetLayout }
		</button>
	</div>
);
