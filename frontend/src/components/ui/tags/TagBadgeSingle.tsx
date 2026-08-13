import { CellPlaceholder } from '@/components/dataTable/cells/CellPlaceholder.tsx';
import { TagBadge } from './TagBadge';
import type { TagOption } from './tagTypes';

interface TagBadgeSingleProps {
	/** An option id, as the row stores it. Nothing, or an id with no matching option, reads as empty. */
	id: string | null | undefined;
	options: TagOption[];
}

/**
 * A read-only tag cell holding one id: that option's badge, or the placeholder when nothing matches.
 */
export function TagBadgeSingle({ id, options }: TagBadgeSingleProps) {
	const option = options.find((candidate) => candidate.id === id);

	return option ? <TagBadge label={ option.name } color={ option.color }/> : <CellPlaceholder/>;
}
