import type React from 'react';
import { useId, useState } from 'react';
import { Check, Lock, Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useListboxNavigation } from '@/hooks/useListboxNavigation';
import type { SelectAddNew, SelectOption, SelectPanelMode, SelectPanelTheme } from './selectTypes';


export const ADD_FORM_WIDTH = '25rem';

const ADD_OPTION_ID = '__add-new__';

const rowHighlight = (active: boolean, selected = false) => cn(
	active && 'ring-1 ring-os-primary/30 ring-inset',
	active && !selected && 'bg-white/2',
);


interface SelectPanelProps {
	options: SelectOption[];
	/** Always a list, even for a single-value select, so one code path draws both. */
	selectedIds: string[];
	onSelect: (id: string) => void;
	onClear?: () => void;
	clearable?: boolean;
	searchable?: boolean;
	multiple?: boolean;
	theme?: SelectPanelTheme;
	className?: string;
	emptyLabel?: string;
	searchPlaceholder?: string;
	addNew?: SelectAddNew;
	onModeChange?: (mode: SelectPanelMode) => void;
	/** Draws an option's body. Defaults to icon plus name; tags draw a badge instead. */
	renderOption?: (option: SelectOption, selected: boolean) => React.ReactNode;
}


/**
 * The one option list behind every select in the application - both the form field and the inline cell variants, for plain options and for tags.
 */
export const SelectPanel = (props: SelectPanelProps) => {
	const {
		options,
		selectedIds,
		onSelect,
		onClear,
		clearable = false,
		searchable = true,
		multiple = false,
		theme = 'modal',
		className,
		emptyLabel = 'Brak opcji',
		searchPlaceholder = 'Szukaj…',
		addNew,
		onModeChange,
		renderOption,
	} = props;

	const panelId = useId();

	const [query, setQuery] = useState('');
	const [mode, setMode] = useState<SelectPanelMode>('select');

	const changeMode = (next: SelectPanelMode) => {
		setMode(next);
		onModeChange?.(next);
	};

	const needle = query.trim().toLowerCase();
	const filtered = needle ? options.filter((option) => option.name.toLowerCase().includes(needle)) : options;

	const pickable = filtered.filter((option) => !option.disabled);

	const navigable = addNew ? [{ id: ADD_OPTION_ID }, ...pickable] : pickable;

	const { listRef, activeOptionId, setActiveId, handleKeyDown } = useListboxNavigation(navigable, {
		onPick: (id) => {
			if (id === ADD_OPTION_ID) {
				changeMode('add');
				return;
			}

			onSelect(id);
		},
		// Typing and then hitting Enter has to land on a match, never on the add row.
		leadOptionId: needle.length > 0 ? pickable[0]?.id ?? null : null,
		focusList: !searchable && mode === 'select',
	});

	const showClear = clearable && selectedIds.length > 0 && onClear !== undefined;

	/** One shared column for icons, so names stay aligned whether or not an option has one. */
	const reserveIconColumn = filtered.some((option) => option.icon !== undefined);

	const surface = cn(
		'flex min-h-0 flex-col overflow-hidden rounded-xl',
		theme === 'modal' ? 'border border-os-primary bg-os-surface shadow-xl' : 'popover-surface shadow-xl',
		className,
	);

	if (mode === 'add' && addNew) {
		return (
			<div className={ surface }>
				{ addNew.renderForm(() => changeMode('select'), (newId) => {
					changeMode('select');
					onSelect(newId);
				}) }
			</div>
		);
	}

	return (
		<div className={ surface } onKeyDown={ handleKeyDown }>
			{ searchable && (
				<div className="flex shrink-0 items-center gap-1.5 border-b border-os-border/40 px-2 pt-2 pb-1.5">
					<input
						autoFocus
						value={ query }
						onChange={ (event) => setQuery(event.target.value) }
						placeholder={ searchPlaceholder }
						aria-controls={ `${ panelId }-list` }
						aria-activedescendant={ activeOptionId === null ? undefined : `${ panelId }-${ activeOptionId }` }
						className="min-w-0 flex-1 rounded-lg bg-white/5 px-2 py-1 text-sm text-os-text outline-none placeholder:text-os-text-muted"
					/>

					{ showClear && (
						<button
							type="button"
							title="Wyczyść wybór"
							onMouseDown={ (event) => {
								event.preventDefault();
								onClear();
								setQuery('');
							} }
							className="shrink-0 rounded-md p-1 text-os-text-muted transition-colors hover:text-os-text"
						>
							<X size={ 16 }/>
						</button>
					) }
				</div>
			) }

			<div
				ref={ listRef }
				id={ `${ panelId }-list` }
				role="listbox"
				aria-multiselectable={ multiple || undefined }
				tabIndex={ searchable ? undefined : -1 }
				className="themed-scrollbar min-h-0 flex-1 overflow-y-auto p-1 outline-none"
			>
				{ addNew && (
					<button
						type="button"
						role="option"
						id={ `${ panelId }-${ ADD_OPTION_ID }` }
						aria-selected={ false }
						data-active={ activeOptionId === ADD_OPTION_ID }
						onMouseDown={ (event) => {
							event.preventDefault();
							event.stopPropagation();
							changeMode('add');
						} }
						onMouseEnter={ () => setActiveId(ADD_OPTION_ID) }
						className={ cn(
							'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-os-text-muted transition-colors',
							rowHighlight(activeOptionId === ADD_OPTION_ID),
						) }
					>
						<Plus size={ 12 }/>
						{ addNew.label }
					</button>
				) }

				{ filtered.length === 0 && (
					<div className="px-3 py-2.5 text-center text-sm text-os-text-muted">{ emptyLabel }</div>
				) }

				{ filtered.map((option) => {
					const selected = selectedIds.includes(option.id);
					const active = option.id === activeOptionId;

					return (
						<button
							key={ option.id }
							type="button"
							role="option"
							id={ `${ panelId }-${ option.id }` }
							aria-selected={ selected }
							disabled={ option.disabled }
							data-active={ active }
							onMouseDown={ (event) => {
								event.preventDefault();
								onSelect(option.id);
							} }
							onMouseEnter={ () => setActiveId(option.id) }
							className={ cn(
								'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors',
								option.disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
								rowHighlight(active, selected),
							) }
						>
							<span className="flex min-w-0 flex-1 items-center gap-2.5">
								{ renderOption ? renderOption(option, selected) : (
									<>
										{ reserveIconColumn && (
											<span className="flex size-4 shrink-0 items-center justify-center text-os-text-muted">
												{ option.icon }
											</span>
										) }
										<span className="truncate text-os-text">{ option.name }</span>
									</>
								) }
							</span>

							{ option.hint && (
								<span className="shrink-0 text-xs text-os-text-muted">{ option.hint }</span>
							) }

							{ option.disabled
								? <Lock size={ 16 } className="shrink-0 text-os-text-muted"/>
								: selected
									? <Check size={ 20 } className="shrink-0 text-os-primary"/>
									: null }
						</button>
					);
				}) }
			</div>
		</div>
	);
};
