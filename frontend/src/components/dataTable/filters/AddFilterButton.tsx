import { Plus } from 'lucide-react';
import { useSelectPopover } from '@/hooks/useSelectPopover';
import { SelectPopover } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { dataTableStrings } from '@/components/dataTable';
import type { FilterableColumn, FilterActiveTag } from '../types/filterTypes';
import { FilterTagPopover } from './FilterTagPopover';


interface AddFilterButtonProps {
	filterableColumns: FilterableColumn[];
	hasAdvancedFilter: boolean;
	maxAdvancedRules?: number;
	onAddTag: (tag: FilterActiveTag) => void;
}


export const AddFilterButton = (props: AddFilterButtonProps) => {
	const { filterableColumns, hasAdvancedFilter, maxAdvancedRules, onAddTag } = props;

	const popover = useSelectPopover({ width: 'auto', maxHeight: 720 });
	const { open, setReference, getReferenceProps, close } = popover;

	return (
		<>
			<button
				ref={ setReference }
				type="button"
				aria-haspopup="dialog"
				aria-expanded={ open }
				{ ...getReferenceProps() }
				className={ cn(
					'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium transition-colors outline-none',
					open
						? 'border-os-primary/50 bg-os-primary/10 text-os-primary'
						: 'border-os-border/70 text-os-text-muted hover:border-os-border hover:text-os-text/80',
				) }
			>
				<Plus size={ 14 }/>
				{ dataTableStrings.filter.add }
			</button>

			<SelectPopover popover={ popover }>
				<FilterTagPopover
					filterableColumns={ filterableColumns }
					hasAdvancedFilter={ hasAdvancedFilter }
					maxAdvancedRules={ maxAdvancedRules }
					onSubmit={ onAddTag }
					onClose={ close }
				/>
			</SelectPopover>
		</>
	);
};
