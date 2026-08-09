import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * A sortable row in a vertical list.
 */
export function useSortableItem(id: string) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
		zIndex: isDragging ? 20 : undefined,
		position: isDragging ? 'relative' : undefined,
	};

	return { attributes, listeners, setNodeRef, style, isDragging };
}
