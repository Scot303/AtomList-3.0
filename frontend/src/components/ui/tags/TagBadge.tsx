import { cn } from '@/lib/cn';
import type { TagColor } from './tagTypes';
import { TAG_COLOR_CLASSES } from './tagTypes';

interface TagBadgeProps {
	label: string;
	color: TagColor | string;
	size?: 'sm' | 'default';
	truncate?: boolean;
}

export const TagBadge = ({ label, color, size = 'default', truncate = true }: TagBadgeProps) => {
	const isHex = typeof color === 'string' && color.startsWith('#');

	return (
		<span
			className={ cn(
				'inline-flex items-center rounded-full whitespace-nowrap',
				size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-0.5',
				!isHex && TAG_COLOR_CLASSES[color as TagColor],
				truncate && 'max-w-full overflow-hidden',
			) }
			style={ isHex ? { backgroundColor: `${ color }26`, color } : undefined }
		>
			{ truncate ? <span className="truncate">{ label }</span> : label }
		</span>
	);
};