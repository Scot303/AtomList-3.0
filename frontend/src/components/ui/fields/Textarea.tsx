import type React from 'react';
import { type Ref, useId, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { FieldShell } from './FieldShell';
import { fieldControl, type FieldSize } from './fieldStyles';


/** Roughly one line of text at the kit's line-height, for translating rows into pixels. */
const LINE_HEIGHT_REM = 1.5;

export type TextareaResize = 'none' | 'vertical' | 'both';


interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
	label: string;
	error?: string;
	hint?: string;
	size?: FieldSize;
	/** Shortest the box gets. Also its starting height. */
	minRows?: number;
	/** Tallest it grows to before scrolling. Omit to let it grow without limit. */
	maxRows?: number;
	/** Grows with its content instead of scrolling. Off by default - it fights a manual resize. */
	autoResize?: boolean;
	resize?: TextareaResize;
	ref?: Ref<HTMLTextAreaElement>;
}


const RESIZE_CLASS: Record<TextareaResize, string> = {
	none: 'resize-none',
	vertical: 'resize-y',
	both: 'resize',
};

/**
 * A multi-line text field.
 */
export const Textarea = (props: TextareaProps) => {
	const {
		className,
		label,
		error,
		hint,
		size = 'default',
		minRows = 3,
		maxRows,
		autoResize = false,
		resize = 'vertical',
		disabled,
		onChange,
		ref,
		...rest
	} = props;

	const id = useId();
	const innerRef = useRef<HTMLTextAreaElement>(null);

	const setRef = (element: HTMLTextAreaElement | null) => {
		innerRef.current = element;

		if (typeof ref === 'function') {
			ref(element);
		} else if (ref) {
			ref.current = element;
		}
	};

	const fit = () => {
		const element = innerRef.current;

		if (!autoResize || element === null) {
			return;
		}

		// Collapse first, so shrinking works and not just growing.
		element.style.height = 'auto';
		element.style.height = `${ element.scrollHeight }px`;
	};

	// Sized before the first paint, so a pre-filled field never flashes at the wrong height.
	useLayoutEffect(fit, [fit, rest.value]);

	return (
		<FieldShell htmlFor={ id } label={ label } error={ error } hint={ hint } size={ size } disabled={ disabled }>
			<textarea
				id={ id }
				ref={ setRef }
				rows={ minRows }
				disabled={ disabled }
				aria-invalid={ error ? true : undefined }
				onChange={ (event) => {
					fit();
					onChange?.(event);
				} }
				style={ {
					minHeight: `${ minRows * LINE_HEIGHT_REM + 1 }rem`,
					maxHeight: maxRows === undefined ? undefined : `${ maxRows * LINE_HEIGHT_REM + 1 }rem`,
				} }
				{ ...rest }
				className={ cn(
					'peer block themed-scrollbar',
					fieldControl(size, { hasError: Boolean(error), disabled }),
					autoResize ? RESIZE_CLASS.none : RESIZE_CLASS[resize],
					'[&::-webkit-resizer]:border-transparent',
					className,
				) }
			/>
		</FieldShell>
	);
};
