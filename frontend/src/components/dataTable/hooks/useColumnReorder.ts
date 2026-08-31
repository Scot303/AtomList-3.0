import { useCallback } from 'react';
import type { ColumnOrderState, OnChangeFn } from '@tanstack/react-table';
import { type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';


/** How far the pointer has to travel before a header press counts as a drag rather than a sort click. */
const DRAG_THRESHOLD_PX = 8;


/**
 * Dragging a header to move its column.
 */
export function useColumnReorder(columnOrder: ColumnOrderState, setColumnOrder: OnChangeFn<ColumnOrderState>): {
	sensors: ReturnType<typeof useSensors>;
	handleDragEnd: (event: DragEndEvent) => void
} {
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: DRAG_THRESHOLD_PX } }));

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (!over || active.id === over.id) {
				return;
			}

			const from = columnOrder.indexOf(String(active.id));
			const to = columnOrder.indexOf(String(over.id));

			if (from === -1 || to === -1) {
				return;
			}

			setColumnOrder(arrayMove(columnOrder, from, to));
		},
		[columnOrder, setColumnOrder],
	);

	return { sensors, handleDragEnd };
}
