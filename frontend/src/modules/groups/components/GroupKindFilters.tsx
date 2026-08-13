import type { FilterActiveTag, FilterTag, TableFilterTagsBinding } from '@/components/dataTable';
import { toHexColor, withAlpha } from '@/components/dataTable/config/tagColors';
import { cn } from '@/lib/cn';
import { GROUP_KIND_COLORS, GROUP_KIND_OPTIONS, type GroupKind, OPEN_KIND, TOURNAMENT_KIND, } from '../types/groupRows.ts';


/** Both kinds selected: neither color is right, so the badge goes violet. */
const MIXED_COLOR = '8B5CF6';


/**
 * Which kinds the chips currently have selected, read back off the filter itself rather than kept alongside it.
 */
function selectedKinds(filterTags: FilterActiveTag[], filterId: string, field: string): GroupKind[] {
	const tag = filterTags.find((candidate) => candidate.id === filterId);

	if (tag === undefined || tag.mode !== 'simple' || tag.field !== field || tag.operator !== 'tag_is_any_of') {
		return [];
	}

	return tag.values.filter((value): value is GroupKind => value === OPEN_KIND || value === TOURNAMENT_KIND);
}


interface GroupKindFiltersProps {
	tags: TableFilterTagsBinding;
	filterId: string;
	field: string;
	titles: Record<GroupKind, string>;
}

/**
 * OPEN and TURNIEJOWE, as a shortcut to a filter the user could equally have built by hand.
 */
export const GroupKindFilters = ({ tags, filterId, field, titles }: GroupKindFiltersProps) => {
	const { filterTags, setFilterTag } = tags;

	const selected = selectedKinds(filterTags, filterId, field);

	const toggle = (kind: GroupKind) => {
		const next = selected.includes(kind) ? selected.filter((value) => value !== kind) : [...selected, kind];

		if (next.length === 0) {
			setFilterTag(filterId, null);
			return;
		}

		const tag: FilterTag = {
			id: filterId,
			mode: 'simple',
			field,
			operator: 'tag_is_any_of',
			values: next,
			color: next.length === 1 ? GROUP_KIND_COLORS[next[0]] : MIXED_COLOR,
		};

		setFilterTag(filterId, tag);
	};

	return (
		<>
			{ GROUP_KIND_OPTIONS.map((option) => {
				const kind = option.id as GroupKind;
				const active = selected.includes(kind);
				const color = GROUP_KIND_COLORS[kind];

				return (
					<button
						key={ kind }
						type="button"
						aria-pressed={ active }
						onClick={ () => toggle(kind) }
						title={ titles[kind] }
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
