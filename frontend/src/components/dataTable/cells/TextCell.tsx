import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { CellPlaceholder } from './CellPlaceholder';
import type { CellEditorProps } from './cellTypes';
import { useOptimisticCellValue } from './useOptimisticCellValue';

/**
 * A cell edited as free text. Also handles numbers.
 * Double-click to edit, Enter or blur to commit, Escape to abandon.
 */
export const TextCell = (props: CellEditorProps) => {
	const { value, rowId, columnId, fieldType, meta, onCommit, onEditingChange } = props;

	const isNumber = fieldType === 'number';
	const committed = String(value ?? '');

	const optimistic = useOptimisticCellValue(committed);
	const inputRef = useRef<HTMLInputElement>(null);

	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(committed);
	const [invalid, setInvalid] = useState(false);

	/**
	 * Focused with the caret after the last character, not with the value selected.
	 */
	useEffect(() => {
		const input = inputRef.current;

		if (!editing || !input) {
			return;
		}

		input.focus();
		input.setSelectionRange(input.value.length, input.value.length);
	}, [editing]);

	const beginEditing = () => {
		setDraft(optimistic.value);
		setInvalid(false);
		setEditing(true);
		onEditingChange?.(true);
	};

	const stopEditing = () => {
		setEditing(false);
		onEditingChange?.(false);
	};

	const commit = () => {
		if (isNumber) {
			const normalised = draft.replace(',', '.').trim();

			if (normalised !== '' && Number.isNaN(Number(normalised))) {
				setInvalid(true);
				return;
			}

			stopEditing();

			const parsed = normalised === '' ? null : Number(normalised);
			const asText = parsed === null ? '' : String(parsed);

			if (asText !== optimistic.value) {
				optimistic.setOptimistic(asText);
				onCommit(rowId, columnId, parsed);
			}

			return;
		}

		stopEditing();

		if (draft !== optimistic.value) {
			optimistic.setOptimistic(draft);
			onCommit(rowId, columnId, draft);
		}
	};

	const cancel = () => {
		stopEditing();
		setInvalid(false);
		setDraft(optimistic.value);
	};

	if (editing) {
		return (
			<input
				ref={ inputRef }
				value={ draft }
				inputMode={ isNumber ? 'decimal' : undefined }
				aria-invalid={ invalid || undefined }
				onChange={ (event) => {
					setDraft(event.target.value);
					setInvalid(false);
				} }
				onBlur={ commit }
				onKeyDown={ (event) => {
					if (event.key === 'Enter') {
						commit();
					}
					if (event.key === 'Escape') {
						cancel();
					}
				} }
				className={ cn(
					'w-full bg-transparent text-sm outline-none',
					invalid ? 'text-os-error' : 'text-os-text',
				) }
			/>
		);
	}

	// The formatter is deliberately skipped while an edit is in flight.
	// It would format the value the user just typed differently from the one they are about to see land.
	const display = optimistic.isPending
		? optimistic.value
		: meta.displayFormatter
			? meta.displayFormatter(value)
			: committed;

	return (
		<span
			role="button"
			tabIndex={ 0 }
			className="block w-full cursor-text rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-os-primary"
			onDoubleClick={ beginEditing }
			onKeyDown={ (event) => {
				if (event.key === 'Enter' || event.key === 'F2') {
					event.preventDefault();
					beginEditing();
				}
			} }
		>
			{ display === '' || display == null ? <CellPlaceholder/> : display }
		</span>
	);
};
