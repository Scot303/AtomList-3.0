import { TagBadge } from './TagBadge';
import type { TagOption } from './tagTypes';


interface TagBadgeOfProps {
	/** An option read out of a {@link TagRecord}, so it is always there. */
	tag: TagOption;
	size?: 'sm' | 'default';
}


/**
 * One known option's badge.
 *
 * The counterpart to {@link TagBadgeById} for values that come from a closed union: there is no id to miss and so no placeholder,
 * and a value the record does not cover fails to compile rather than reading as empty.
 */
export function TagBadgeOf({ tag, size = 'default' }: TagBadgeOfProps) {
	return <TagBadge label={ tag.name } color={ tag.color } size={ size }/>;
}
