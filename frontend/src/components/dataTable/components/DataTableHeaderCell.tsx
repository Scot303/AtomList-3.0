import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/cn';
import type { RenderHeader } from '../types/dataTableTypes';


/** How far one arrow-key press nudges a column's width. */
const RESIZE_STEP = 2;


interface DataTableHeaderCellProps {
	header: RenderHeader;
}


/**
 * One column heading: its label, the sort arrow, and the handle its width is dragged by.
 */
export const DataTableHeaderCell = ({ header }: DataTableHeaderCellProps) => {
	const { columnId, label, content, size, sorted, canSort, canResize, isResizing } = header;

	const sortable = useSortable({ id: columnId });
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

	return (
		<th
			ref={ setNodeRef }
			scope="col"
			aria-sort={ canSort ? ( sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none' ) : undefined }
			style={ {
				transform: CSS.Translate.toString(transform),
				transition,
				zIndex: isDragging ? 20 : 1,
				position: 'relative',
				width: size,
			} }
			className={ cn(
				'select-none overflow-hidden whitespace-nowrap text-left text-xs font-semibold uppercase tracking-wider outline-none',
				isDragging && 'opacity-60',
				sorted ? 'text-os-primary' : 'text-os-text-muted',
			) }
			{ ...attributes }
		>
			<div
				{ ...listeners }
				onClick={ canSort ? header.onToggleSort : undefined }
				className={ cn(
					'flex items-center gap-1 px-4 py-2.5 transition-colors',
					'cursor-pointer active:cursor-grabbing',
					canSort && 'hover:text-os-text',
				) }
			>
				{ content }

				{ canSort && (
					<span aria-hidden className="shrink-0">
						{ sorted === 'asc'
							? <ArrowUp size={ 12 }/>
							: sorted === 'desc'
								? <ArrowDown size={ 12 }/>
								: <ArrowUpDown size={ 11 } className="opacity-40"/>
						}
					</span>
				) }
			</div>

			{ canResize && (
				<div
					role="separator"
					tabIndex={ 0 }
					aria-orientation="vertical"
					aria-label={ `Szerokość kolumny: ${ label }` }
					aria-valuenow={ Math.round(size) }
					onMouseDown={ header.onResizeStart }
					onTouchStart={ header.onResizeStart }
					onClick={ (event) => event.stopPropagation() }
					onKeyDown={ (event) => {
						const delta = event.key === 'ArrowLeft' ? -RESIZE_STEP : event.key === 'ArrowRight' ? RESIZE_STEP : 0;

						if (delta === 0) {
							return;
						}

						event.preventDefault();
						event.stopPropagation();

						header.onResizeStep(delta);
					} }
					className="group/resize absolute right-0 top-0 z-20 flex h-full w-[5px] cursor-col-resize items-center justify-center outline-none"
				>
					<div
						className={ cn(
							'h-4/5 w-0.5 rounded-full transition-colors',
							isResizing
								? 'bg-os-primary'
								: 'bg-os-border group-hover/resize:bg-os-primary group-focus-visible/resize:bg-os-primary',
						) }
					/>
				</div>
			) }
		</th>
	);
};
