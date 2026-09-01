import { CellPlaceholder } from '@/components/dataTable/cells/CellPlaceholder.tsx';
import { TagBadge } from './TagBadge';
import type { TagOption } from './tagTypes';
import { unknownTag } from './tagTypes';


interface TagBadgeByIdProps {
	/** An option id, as the row stores it. Nothing is a cell somebody left empty, which is a choice like any other. */
	id: string | null | undefined;
	options: TagOption[];
	size?: 'sm' | 'default';
}


/**
 * A read-only tag cell holding one id, looked up in the options it is given.
 */
export function TagBadgeById({ id, options, size = 'default' }: TagBadgeByIdProps) {
	if (id === null || id === undefined || id === '') {
		return <CellPlaceholder/>;
	}

	const option = options.find((candidate) => candidate.id === id) ?? unknownTag(id);

	return <TagBadge label={ option.name } color={ option.color } size={ size }/>;
}
