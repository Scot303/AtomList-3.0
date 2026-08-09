import { DEFAULT_MAX_FILTER_TAGS } from '../config/filterLimits';
import type { FilterableColumn, FilterActiveTag, SortTag } from '../types/filterTypes';
import { AddFilterButton } from './AddFilterButton';
import { FilterTagBadge } from './FilterTagBadge';
import { SortBadge } from './SortBadge';

interface FilterBarProps {
	filterTags: FilterActiveTag[];
	sortTags: SortTag[];
	filterableColumns: FilterableColumn[];
	maxFilterTags?: number;
	maxAdvancedRules?: number;
	onAddTag: (tag: FilterActiveTag) => void;
	onRemoveTag: (id: string) => void;
	onUpdateTag: (tag: FilterActiveTag) => void;
	onSortChange: (tags: SortTag[]) => void;
}

export const FilterBar = (props: FilterBarProps) => {
	const {
		filterTags,
		sortTags,
		filterableColumns,
		maxFilterTags = DEFAULT_MAX_FILTER_TAGS,
		maxAdvancedRules,
		onAddTag,
		onRemoveTag,
		onUpdateTag,
		onSortChange,
	} = props;

	const hasAdvancedFilter = filterTags.some((tag) => tag.mode === 'advanced');
	const simpleCount = filterTags.filter((tag) => tag.mode === 'simple').length;

	// Still worth showing while the simple cap is reached, as long as an advanced filter is possible.
	const canAddMore = simpleCount < maxFilterTags || !hasAdvancedFilter;

	return (
		<div className="flex min-h-10 shrink-0 flex-wrap items-center gap-2 border-b border-os-border px-4 py-2">
			<SortBadge sortTags={ sortTags } filterableColumns={ filterableColumns } onSortChange={ onSortChange }/>

			<div aria-hidden className="mx-1 h-5 w-px shrink-0 bg-os-border"/>

			{ filterTags.map((tag) => (
				<FilterTagBadge
					key={ tag.id }
					tag={ tag }
					filterableColumns={ filterableColumns }
					hasAdvancedFilter={ hasAdvancedFilter }
					maxAdvancedRules={ maxAdvancedRules }
					onRemove={ onRemoveTag }
					onUpdate={ onUpdateTag }
				/>
			)) }

			{ canAddMore && (
				<AddFilterButton
					filterableColumns={ filterableColumns }
					hasAdvancedFilter={ hasAdvancedFilter }
					maxAdvancedRules={ maxAdvancedRules }
					onAddTag={ onAddTag }
				/>
			) }
		</div>
	);
};
