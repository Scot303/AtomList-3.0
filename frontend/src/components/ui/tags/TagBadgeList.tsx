import { CellPlaceholder } from '@/components/dataTable/cells/CellPlaceholder.tsx';
import type { TagOption } from '@/components/ui/tags/index.ts';
import { TagBadge } from '@/components/ui/tags/index.ts';

/** Badges drawn side by side before the rest are rolled into a `+N`. */
const MAX_VISIBLE = 3;

interface TagBadgeListProps {
	/** Option ids, as the row stores them. Ids with no matching option are skipped. */
	ids: string[];
	options: TagOption[];
}

/**
 * A read-only tag cell: the row's badges, with anything past the N counted rather than drawn.
 */
export function TagBadgeList({ ids, options }: TagBadgeListProps) {
	if (ids.length === 0) {
		return <CellPlaceholder/>;
	}

	const matched = ids
		.map((id) => options.find((option) => option.id === id))
		.filter((option): option is TagOption => option !== undefined);

	const shown = matched.slice(0, MAX_VISIBLE);
	const hidden = matched.slice(MAX_VISIBLE);

	return (
		<span className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
			{ shown.map((option) => (
				<TagBadge key={ option.id } label={ option.name } color={ option.color }/>
			)) }

			{ hidden.length > 0 && (
				<span
					title={ hidden.map((option) => option.name).join(', ') }
					className="shrink-0 text-xs text-os-text-muted"
				>
					+{ hidden.length }
				</span>
			) }
		</span>
	);
}
