import type { FilterActiveTag, FilterTag, TableFilterTagsBinding } from '@/components/dataTable';
import { toHexColor, withAlpha } from '@/components/dataTable/config/tagColors';
import { cn } from '@/lib/cn';
import { GROUP_KIND_COLORS, GROUP_KIND_OPTIONS, type GroupKind, OPEN_KIND, TOURNAMENT_KIND, } from '../types/personRows.ts';

/**
 * The id the chips keep their filter under.
 * Fixed, so however often they are pressed there is only ever one of them.
 */
const QUICK_FILTER_ID = 'persons-quick-group-kind';

/** The column the chips filter, which has to be the id of the 'Typ' column. */
const FIELD = 'groupKinds';

/** Both kinds selected: neither color is right, so the badge goes violet. */
const MIXED_COLOR = '8B5CF6';


/**
 * Which kinds the chips currently have selected, read back off the filter itself rather than kept alongside it.
 */
function selectedKinds(filterTags: FilterActiveTag[]): GroupKind[] {
	const tag = filterTags.find((candidate) => candidate.id === QUICK_FILTER_ID);

	if (tag === undefined || tag.mode !== 'simple' || tag.field !== FIELD || tag.operator !== 'tag_is_any_of') {
		return [];
	}

	return tag.values.filter((value): value is GroupKind => value === OPEN_KIND || value === TOURNAMENT_KIND);
}


interface QuickGroupFiltersProps {
	tags: TableFilterTagsBinding;
}

/**
 * OPEN and TURNIEJOWE, as a shortcut to a filter the user could equally have built by hand.
 */
export const QuickGroupFilters = ({ tags }: QuickGroupFiltersProps) => {
	const { filterTags, setFilterTag } = tags;

	const selected = selectedKinds(filterTags);

	const toggle = (kind: GroupKind) => {
		const next = selected.includes(kind) ? selected.filter((value) => value !== kind) : [...selected, kind];

		if (next.length === 0) {
			setFilterTag(QUICK_FILTER_ID, null);
			return;
		}

		const tag: FilterTag = {
			id: QUICK_FILTER_ID,
			mode: 'simple',
			field: FIELD,
			operator: 'tag_is_any_of',
			values: next,
			color: next.length === 1 ? GROUP_KIND_COLORS[next[0]] : MIXED_COLOR,
		};

		setFilterTag(QUICK_FILTER_ID, tag);
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
						title={
							kind === OPEN_KIND
								? 'Pokaż osoby zapisane do grup nieturniejowych'
								: 'Pokaż osoby zapisane do grup turniejowych'
						}
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
