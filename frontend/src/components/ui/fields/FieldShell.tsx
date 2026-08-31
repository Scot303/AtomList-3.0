import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { popoverAnchorProps } from '@/lib/popoverAnchor';
import { fieldError, fieldErrorIconSize, fieldHint, fieldLabel, fieldMessage, type FieldSize, fieldWrapper, showsLabel, } from './fieldStyles';


interface FieldShellProps {
	/** The control itself. Position adornments against it with `relative` already applied. */
	children: ReactNode;
	/** Ties the label to the control. Omit for a control that is not a single focusable element. */
	htmlFor?: string;
	label?: string;
	error?: string;
	/** Guidance below the control. Hidden while an error is showing - the error matters more. */
	hint?: string;
	size?: FieldSize;
	disabled?: boolean;
	className?: string;
	/** Set when the control is not a native input, so the label is not a `<label>` at all. */
	labelAs?: 'label' | 'span';
}


/**
 * The style around a form control: label above, error below, and the positioning context an icon
 * or a trailing button needs.
 *
 * Every field in the kit is this shell plus its own behavior, so they cannot drift apart.
 */
export const FieldShell = (props: FieldShellProps) => {
	const {
		children,
		htmlFor,
		label,
		error,
		hint,
		size = 'default',
		disabled,
		className,
		labelAs = 'label',
	} = props;

	const hasError = error !== undefined && error !== '';
	const LabelTag = labelAs;

	return (
		<div className={ cn(fieldWrapper(disabled), className) }>
			{ showsLabel(size) && label && (
				<LabelTag htmlFor={ labelAs === 'label' ? htmlFor : undefined } className={ fieldLabel({ hasError }) }>
					{ label }
				</LabelTag>
			) }

			{ /* The anchor, so a panel opened from an adornment hangs off the whole control rather than the little button that opened it. */ }
			<div { ...popoverAnchorProps } className="relative">{ children }</div>

			<div className={ fieldMessage }>
				{ hasError ? (
					<p className={ fieldError }>
						<AlertCircle size={ fieldErrorIconSize } className="shrink-0"/> { error }
					</p>
				) : hint ? (
					<span className={ fieldHint }>{ hint }</span>
				) : null }
			</div>
		</div>
	);
};
