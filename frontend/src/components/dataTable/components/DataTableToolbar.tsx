import { type ReactNode, useState } from 'react';
import { Eye, Filter, Layers, Search, X } from 'lucide-react';
import type { GroupingState } from '@tanstack/react-table';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { dataTableStrings } from '@/components/dataTable';
import { type GroupableColumn, GroupPanel } from './GroupPanel';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarPanel } from './ToolbarPanel';
import { type VisibilityColumn, VisibilityPanel } from './VisibilityPanel';

const SEARCH_DEBOUNCE_MS = 0;

interface DataTableToolbarProps {
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	showFilters: boolean;
	onToggleFilters: () => void;
	filterTagCount: number;
	visibilityColumns: VisibilityColumn[];
	groupableColumns: GroupableColumn[];
	grouping: GroupingState;
	onGroupingChange: (grouping: GroupingState) => void;
	enableGrouping: boolean;
	onResetLayout: () => void;
	toolbarStart?: ReactNode;
	toolbar?: ReactNode;
}

export const DataTableToolbar = (props: DataTableToolbarProps) => {
	const {
		globalFilter,
		onGlobalFilterChange,
		showFilters,
		onToggleFilters,
		filterTagCount,
		visibilityColumns,
		groupableColumns,
		grouping,
		onGroupingChange,
		enableGrouping,
		onResetLayout,
		toolbarStart,
		toolbar,
	} = props;

	/**
	 * The box keeps its own value, so typing stays responsive.
	 */
	const [query, setQuery] = useState(globalFilter);
	const [lastExternal, setLastExternal] = useState(globalFilter);

	const debounced = useDebouncedCallback(onGlobalFilterChange, SEARCH_DEBOUNCE_MS);
	const { run, flush } = debounced;

	/**
	 * Follows the filter being cleared from elsewhere without fighting the user mid-word.
	 */
	if (lastExternal !== globalFilter) {
		setLastExternal(globalFilter);

		if (globalFilter === '' && query !== '') {
			setQuery('');
		}
	}

	const groupedLabel = grouping.length > 0
		? `${ dataTableStrings.table.groupedBy }: ${ groupableColumns.find((column) => column.id === grouping[0])?.label ?? grouping[0] }`
		: dataTableStrings.table.group;

	return (
		<div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-os-border px-4 py-3">
			{ toolbarStart && <div className="flex items-center gap-2">{ toolbarStart }</div> }

			<div className="relative min-w-36 flex-1">
				<Search size={ 14 } aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-os-text-muted"/>

				<input
					type="search"
					value={ query }
					aria-label={ dataTableStrings.table.searchPlaceholder }
					placeholder={ dataTableStrings.table.searchPlaceholder }
					onChange={ (event) => {
						setQuery(event.target.value);
						run(event.target.value);
					} }
					onBlur={ () => flush(query) }
					className="w-full rounded-lg border border-os-border bg-os-surface py-1.5 pl-8 pr-8 text-sm text-os-text outline-none transition-colors placeholder:text-os-text-muted focus:border-os-primary [&::-webkit-search-cancel-button]:hidden"
				/>

				{ query !== '' && (
					<button
						type="button"
						aria-label="Wyczyść"
						onClick={ () => {
							setQuery('');
							flush('');
						} }
						className="absolute right-2.5 top-1/2 -translate-y-1/2 text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:text-os-text"
					>
						<X size={ 16 }/>
					</button>
				) }
			</div>

			<ToolbarButton
				icon={ <Filter size={ 13 }/> }
				label={ dataTableStrings.table.filters }
				active={ showFilters }
				badge={ filterTagCount }
				aria-pressed={ showFilters }
				onClick={ onToggleFilters }
			/>

			<ToolbarPanel
				icon={ <Eye size={ 13 }/> }
				label={ dataTableStrings.table.columns }
				title={ dataTableStrings.table.columns }
			>
				{ (close) => (
					<VisibilityPanel columns={ visibilityColumns } onResetLayout={ onResetLayout } onClose={ close }/>
				) }
			</ToolbarPanel>

			{ enableGrouping && (
				<ToolbarPanel
					icon={ <Layers size={ 13 }/> }
					label={ groupedLabel }
					active={ grouping.length > 0 }
					title={ dataTableStrings.table.group }
				>
					{ (close) => (
						<GroupPanel
							columns={ groupableColumns }
							grouping={ grouping }
							onChange={ onGroupingChange }
							onClose={ close }
						/>
					) }
				</ToolbarPanel>
			) }

			{ toolbar && <div className="ml-auto flex items-center gap-2">{ toolbar }</div> }
		</div>
	);
};
