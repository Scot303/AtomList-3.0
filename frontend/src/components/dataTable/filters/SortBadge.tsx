import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useSelectPopover } from '@/hooks/useSelectPopover';
import { SelectPopover } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { dataTableStrings } from '@/components/dataTable';
import type { FilterableColumn, SortTag } from '../types/filterTypes';
import { SortPopover } from './SortPopover';


interface SortBadgeProps {
	sortTags: SortTag[];
	filterableColumns: FilterableColumn[];
	onSortChange: (tags: SortTag[]) => void;
}


export const SortBadge = ({ sortTags, filterableColumns, onSortChange }: SortBadgeProps) => {
	const popover = useSelectPopover({ width: '28rem', maxHeight: 520 });
	const { open, setReference, getReferenceProps } = popover;

	const isActive = sortTags.length > 0;

	return (
		<>
			<button
				ref={ setReference }
				type="button"
				aria-haspopup="dialog"
				aria-expanded={ open }
				{ ...getReferenceProps() }
				className={ cn(
					'inline-flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium transition-colors outline-none',
					isActive
						? 'border-os-primary/50 bg-os-primary/10 text-os-primary hover:bg-os-primary/20'
						: 'border-os-border/70 text-os-text-muted hover:border-os-border hover:text-os-text/80',
				) }
			>
				<ArrowUpDown size={ 14 } aria-hidden className="shrink-0"/>
				<BadgeLabel sortTags={ sortTags } filterableColumns={ filterableColumns }/>
			</button>

			<SelectPopover popover={ popover }>
				<SortPopover sortTags={ sortTags } filterableColumns={ filterableColumns } onSave={ onSortChange }/>
			</SelectPopover>
		</>
	);
};

const BadgeLabel = ({ sortTags, filterableColumns }: { sortTags: SortTag[]; filterableColumns: FilterableColumn[] }) => {
	if (sortTags.length === 0) {
		return <span>{ dataTableStrings.sort.none }</span>;
	}

	if (sortTags.length === 1) {
		const [tag] = sortTags;
		const label = filterableColumns.find((column) => column.id === tag.field)?.label ?? tag.field;

		return (
			<span className="inline-flex items-center gap-1">
				{ label }
				{ tag.direction === 'asc' ? <ArrowUp size={ 14 }/> : <ArrowDown size={ 14 }/> }
			</span>
		);
	}

	return <span>{ dataTableStrings.sort.nSorts(sortTags.length) }</span>;
};
