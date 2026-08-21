import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { PopoverClipContext } from '@/hooks/usePopoverClip';
import { DataTableToolbar } from './components/DataTableToolbar';
import { DataTableHeaderCell } from './components/DataTableHeaderCell';
import { DataTableBody } from './components/DataTableBody';
import { DataTableStatusBar } from './components/DataTableStatusBar';
import { FilterBar } from './filters/FilterBar';
import type { DataTableProps } from './types/dataTableTypes';
import { useDataTable } from './hooks/useDataTable';


/**
 * Space kept below the last row so a cell editor opening near the bottom has somewhere to hang.
 */
const BOTTOM_GUTTER = 'pb-100';


export const DataTable = <T extends object>(props: DataTableProps<T>) => {
	const {
		globalFilter, setGlobalFilter,
		showFilters, toggleFilters,
		filterTags, setFilterTags,
		sortTags, setSortTags,
		grouping, setGrouping,
		filterableColumns, visibilityColumns, groupableColumns,
		enableGrouping, toolbarStart, toolbar,
		onCellEdit, onRowClick, onRowContextMenu,
		contextRowId, setContextRowId,
		emptyMessage, isLoading,
		sensors, handleDragEnd, orderedColumnIds, headerGroups,
		totalWidth, bodyRows,
		scrollRef, headRef, popoverClip,
		renderRows, paddingTop, paddingBottom, measureRow,
		filteredRowCount, totalRowCount,
		resetLayout, maxFilterTags, maxAdvancedRules,
	} = useDataTable(props);

	return (
		<div className="flex h-full flex-col overflow-hidden">
			<DataTableToolbar
				globalFilter={ globalFilter }
				onGlobalFilterChange={ setGlobalFilter }
				showFilters={ showFilters }
				onToggleFilters={ toggleFilters }
				filterTagCount={ filterTags.length }
				visibilityColumns={ visibilityColumns }
				groupableColumns={ groupableColumns }
				grouping={ grouping }
				onGroupingChange={ setGrouping }
				enableGrouping={ enableGrouping }
				onResetLayout={ resetLayout }
				toolbarStart={ toolbarStart }
				toolbar={ toolbar }
			/>

			{ showFilters && (
				<FilterBar
					filterTags={ filterTags }
					sortTags={ sortTags }
					filterableColumns={ filterableColumns }
					maxFilterTags={ maxFilterTags }
					maxAdvancedRules={ maxAdvancedRules }
					onAddTag={ (tag) => setFilterTags((tags) => [...tags, tag]) }
					onRemoveTag={ (id) => setFilterTags((tags) => tags.filter((tag) => tag.id !== id)) }
					onUpdateTag={ (updated) => setFilterTags((tags) => tags.map((tag) => ( tag.id === updated.id ? updated : tag ))) }
					onSortChange={ setSortTags }
				/>
			) }

			<div ref={ scrollRef } className={ `themed-scrollbar flex-1 overflow-auto ${ BOTTOM_GUTTER }` }>
				<PopoverClipContext value={ popoverClip }>
					<DndContext
						sensors={ sensors }
						collisionDetection={ closestCenter }
						modifiers={ [restrictToHorizontalAxis] }
						onDragEnd={ handleDragEnd }
					>
						<table
							aria-rowcount={ bodyRows.length + 1 }
							className="border-collapse text-sm"
							style={ { tableLayout: 'fixed', width: totalWidth } }
						>
							<thead
								ref={ headRef }
								className="sticky top-0 z-10 bg-os-surface [box-shadow:0_1px_0_0_var(--color-os-border)]"
							>
							{ headerGroups.map((headerGroup) => (
								<SortableContext
									key={ headerGroup.id }
									items={ orderedColumnIds }
									strategy={ horizontalListSortingStrategy }
								>
									<tr aria-rowindex={ 1 }>
										{ headerGroup.headers.map((header) => (
											<DataTableHeaderCell key={ header.id } header={ header }/>
										)) }
									</tr>
								</SortableContext>
							)) }
							</thead>

							<tbody>
							<DataTableBody
								renderRows={ renderRows }
								rowCount={ bodyRows.length }
								paddingTop={ paddingTop }
								paddingBottom={ paddingBottom }
								measureRow={ measureRow }
								visibleColumnCount={ orderedColumnIds.length }
								isLoading={ isLoading }
								emptyMessage={ emptyMessage }
								onCellEdit={ onCellEdit }
								onRowClick={ onRowClick }
								onRowContextMenu={ onRowContextMenu }
								contextRowId={ contextRowId }
								onContextRowChange={ setContextRowId }
							/>
							</tbody>
						</table>
					</DndContext>
				</PopoverClipContext>
			</div>

			<DataTableStatusBar filteredRowCount={ filteredRowCount } totalRowCount={ totalRowCount }/>
		</div>
	);
};
