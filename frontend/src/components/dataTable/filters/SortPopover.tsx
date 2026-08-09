import { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from 'lucide-react';
import { closestCenter, DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortableItem } from '@/hooks/useSortableItem';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { cn } from '@/lib/cn';
import { dataTableStrings } from '@/components/dataTable';
import type { FilterableColumn, SortDirection, SortTag } from '../types/filterTypes';


interface SortPopoverProps {
	sortTags: SortTag[];
	filterableColumns: FilterableColumn[];
	onSave: (tags: SortTag[]) => void;
}

/** Sort rules, applied in order: the first one wins, later ones only break its ties. */
export const SortPopover = ({ sortTags, filterableColumns, onSave }: SortPopoverProps) => {
	const [tags, setTags] = useState<SortTag[]>(sortTags);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

	const commit = (next: SortTag[]) => {
		setTags(next);
		onSave(next);
	};

	const usedFields = new Set(tags.map((tag) => tag.field));
	const availableColumns = filterableColumns.filter((column) => !usedFields.has(column.id));

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		const from = tags.findIndex((tag) => tag.id === active.id);
		const to = tags.findIndex((tag) => tag.id === over.id);

		if (from === -1 || to === -1) {
			return;
		}

		commit(arrayMove(tags, from, to));
	};

	const addSort = () => {
		const column = availableColumns[0];

		if (column === undefined) {
			return;
		}

		commit([...tags, { id: crypto.randomUUID(), field: column.id, direction: 'asc' }]);
	};

	return (
		<div className="popover-surface flex min-h-0 flex-col rounded-xl">
			<div className="border-b border-os-border p-3">
				<span className="text-sm font-semibold uppercase tracking-wide text-os-text-muted">
					{ dataTableStrings.sort.title }
				</span>
			</div>

			<div className="themed-scrollbar flex min-h-18 flex-1 flex-col gap-1 overflow-y-auto p-3 [scrollbar-gutter:stable]">
				{ tags.length === 0 ? (
					<p className="py-3 text-center text-sm text-os-text-muted">{ dataTableStrings.sort.empty }</p>
				) : (
					<DndContext
						sensors={ sensors }
						collisionDetection={ closestCenter }
						modifiers={ [restrictToVerticalAxis] }
						onDragEnd={ handleDragEnd }
					>
						<SortableContext items={ tags.map((tag) => tag.id) } strategy={ verticalListSortingStrategy }>
							{ tags.map((tag) => (
								<SortRow
									key={ tag.id }
									tag={ tag }
									// Its own column stays offered so the select has something selected to show.
									columns={ filterableColumns.filter((column) => column.id === tag.field || !usedFields.has(column.id)) }
									onFieldChange={ (field) => commit(tags.map((candidate) => (candidate.id === tag.id ? { ...candidate, field } : candidate))) }
									onDirectionChange={ (direction) => commit(tags.map((candidate) => (candidate.id === tag.id ? { ...candidate, direction } : candidate))) }
									onRemove={ () => commit(tags.filter((candidate) => candidate.id !== tag.id)) }
								/>
							)) }
						</SortableContext>
					</DndContext>
				) }
			</div>

			{ availableColumns.length > 0 && (
				<div className="px-3 pb-3 pt-1">
					<button
						type="button"
						onClick={ addSort }
						className="flex items-center gap-1.5 px-1 py-1 text-sm text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:text-os-text"
					>
						<Plus size={ 14 }/>
						{ dataTableStrings.sort.add }
					</button>
				</div>
			) }
		</div>
	);
};


/* ── One rule ────────────────────────────────────────────────────────────── */

interface SortRowProps {
	tag: SortTag;
	columns: FilterableColumn[];
	onFieldChange: (field: string) => void;
	onDirectionChange: (direction: SortDirection) => void;
	onRemove: () => void;
}

const SortRow = ({ tag, columns, onFieldChange, onDirectionChange, onRemove }: SortRowProps) => {
	const sortable = useSortableItem(tag.id);
	const { attributes, listeners, setNodeRef, style, isDragging } = sortable;

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			className={ cn('flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors', isDragging && 'opacity-60') }
		>
			<button
				type="button"
				aria-label={ dataTableStrings.sort.reorder }
				{ ...attributes }
				{ ...listeners }
				className="shrink-0 cursor-grab text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:text-os-text active:cursor-grabbing"
			>
				<GripVertical size={ 14 }/>
			</button>

			<div className="min-w-0 flex-1">
				<ExtendedSelect
					size="sm"
					options={ columns.map((column) => ({ id: column.id, name: column.label })) }
					value={ tag.field }
					onChange={ (field) => {
						if (field) {
							onFieldChange(field);
						}
					} }
				/>
			</div>

			<div role="radiogroup" aria-label={ dataTableStrings.sort.title } className="flex shrink-0 items-center overflow-hidden rounded-lg border border-os-border">
				{ (['asc', 'desc'] as const).map((direction) => (
					<button
						key={ direction }
						type="button"
						role="radio"
						aria-checked={ tag.direction === direction }
						title={ direction === 'asc' ? dataTableStrings.sort.ascending : dataTableStrings.sort.descending }
						onClick={ () => onDirectionChange(direction) }
						className={ cn(
							'flex h-7 w-7 items-center justify-center transition-colors outline-none',
							tag.direction === direction
								? 'bg-os-primary/15 text-os-primary'
								: 'text-os-text-muted hover:bg-os-border/20 hover:text-os-text',
						) }
					>
						{ direction === 'asc' ? <ArrowUp size={ 14 }/> : <ArrowDown size={ 14 }/> }
					</button>
				)) }
			</div>

			<button
				type="button"
				aria-label={ dataTableStrings.sort.remove }
				onClick={ onRemove }
				className="-mr-1 ml-2 shrink-0 text-os-text-muted transition-colors outline-none hover:text-os-error focus-visible:text-os-error"
			>
				<X size={ 16 }/>
			</button>
		</div>
	);
};
