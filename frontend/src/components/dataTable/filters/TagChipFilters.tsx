import { resolveTagHex, type TagOption } from '@/components/ui/tags';
import { cn } from '@/lib/cn';
import type { TableFilterTagsBinding } from '@/components/dataTable';
import type { FilterActiveTag, FilterTag } from '../types/filterTypes';
import { toHexColor, withAlpha } from '../config/tagColors';


/**
 * Which option the chips currently have selected, read back off the filter itself rather than kept alongside it.
 */
function selectedId(filterTags: FilterActiveTag[], filterId: string, field: string, options: TagOption[]): string | undefined {
	const tag = filterTags.find((candidate) => candidate.id === filterId);

	if (tag === undefined || tag.mode !== 'simple' || tag.field !== field || tag.operator !== 'tag_is_any_of') {
		return undefined;
	}

	return tag.values.find((value) => options.some((option) => option.id === value));
}


interface TagChipFiltersProps {
	tags: TableFilterTagsBinding;
	filterId: string;
	field: string;
	options: TagOption[];
	/** Tooltip per option id. An id with none simply has no tooltip. */
	titles?: Record<string, string>;
}


/**
 * A row of quick-filter chips, as a shortcut to a filter the user could equally have built by hand.
 *
 * Only one chip can be picked at a time, so picking another replaces it. Toggling the picked chip off drops the filter rather than leaving an empty one behind.
 */
export const TagChipFilters = ({ tags, filterId, field, options, titles }: TagChipFiltersProps) => {
	const { filterTags, setFilterTag } = tags;

	const selected = selectedId(filterTags, filterId, field, options);

	const toggle = (id: string) => {
		if (selected === id) {
			setFilterTag(filterId, null);
			return;
		}

		const option = options.find((candidate) => candidate.id === id);

		if (option === undefined) {
			return;
		}

		const tag: FilterTag = {
			id: filterId,
			mode: 'simple',
			field,
			operator: 'tag_is_any_of',
			values: [id],
			color: resolveTagHex(option.color),
		};

		setFilterTag(filterId, tag);
	};

	return (
		<>
			{ options.map((option) => {
				const active = selected === option.id;
				const color = resolveTagHex(option.color);

				return (
					<button
						key={ option.id }
						type="button"
						aria-pressed={ active }
						onClick={ () => toggle(option.id) }
						title={ titles?.[option.id] }
						style={ {
							borderColor: withAlpha(color, active ? '80' : '40'),
							backgroundColor: withAlpha(color, active ? '25' : '0D'),
							color: active ? toHexColor(color) : undefined,
						} }
						className={ cn(
							'shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-bold tracking-wide transition-colors outline-none',
							'focus-visible:ring-2 focus-visible:ring-os-primary/40',
							!active && 'text-os-text-muted hover:text-os-text',
						) }
					>
						{ option.name }
					</button>
				);
			}) }
		</>
	);
};
