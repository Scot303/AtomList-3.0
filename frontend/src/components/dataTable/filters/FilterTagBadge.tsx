import type { ElementType } from 'react';
import { BadgeCheck, Calendar, Filter, Hash, SquareMousePointer, Tag, Type, X } from 'lucide-react';
import { useSelectPopover } from '@/hooks/useSelectPopover';
import { SelectPopover } from '@/components/ui/select';
import { toHexColor, withAlpha } from '../config/tagColors';
import type { FieldType } from '../types/columnMeta';
import type { AdvancedFilterTag, FilterableColumn, FilterActiveTag, FilterTag } from '../types/filterTypes';
import { AdvancedFilterLabel, FilterLabel } from './FilterTagLabel';
import { FilterTagPopover } from './FilterTagPopover';

const FIELD_TYPE_ICON: Record<FieldType, ElementType> = {
	text: Type,
	number: Hash,
	date: Calendar,
	tag: Tag,
	select: SquareMousePointer,
	boolean: BadgeCheck,
};

interface FilterTagBadgeProps {
	tag: FilterActiveTag;
	filterableColumns: FilterableColumn[];
	hasAdvancedFilter: boolean;
	maxAdvancedRules?: number;
	onRemove: (id: string) => void;
	onUpdate: (tag: FilterActiveTag) => void;
}

/** An applied filter, shown in its own color and reopening its editor when clicked. */
export const FilterTagBadge = (props: FilterTagBadgeProps) => {
	const { tag, filterableColumns, hasAdvancedFilter, maxAdvancedRules, onRemove, onUpdate } = props;

	const popover = useSelectPopover({ width: 'auto', maxHeight: 720 });
	const { open, setReference, getReferenceProps, close } = popover;

	const hex = toHexColor(tag.color);

	const Icon = tag.mode === 'advanced'
		? Filter
		: FIELD_TYPE_ICON[filterableColumns.find((column) => column.id === (tag as FilterTag).field)?.fieldType ?? 'text'];

	return (
		<>
			<span
				className="inline-flex shrink-0 select-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium transition-colors"
				style={ {
					backgroundColor: withAlpha(tag.color, open ? '30' : '18'),
					borderColor: withAlpha(tag.color, '50'),
				} }
			>
				<button
					ref={ setReference }
					type="button"
					aria-haspopup="dialog"
					aria-expanded={ open }
					{ ...getReferenceProps() }
					className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 outline-none"
				>
					<Icon size={ 14 } aria-hidden style={ { color: hex } } className="shrink-0"/>

					<span className="max-w-120 truncate text-os-text">
						{ tag.mode === 'advanced'
							? <AdvancedFilterLabel tag={ tag as AdvancedFilterTag }/>
							: <FilterLabel tag={ tag as FilterTag } filterableColumns={ filterableColumns }/>
						}
					</span>
				</button>

				<button
					type="button"
					aria-label="Usuń filtr"
					onClick={ () => onRemove(tag.id) }
					className="ml-1 shrink-0 text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:text-os-text"
				>
					<X size={ 14 }/>
				</button>
			</span>

			<SelectPopover popover={ popover }>
				<FilterTagPopover
					tag={ tag }
					filterableColumns={ filterableColumns }
					hasAdvancedFilter={ hasAdvancedFilter }
					maxAdvancedRules={ maxAdvancedRules }
					onSubmit={ onUpdate }
					onClose={ close }
				/>
			</SelectPopover>
		</>
	);
};
