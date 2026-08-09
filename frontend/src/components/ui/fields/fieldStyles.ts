import { cn } from '@/lib/cn';

/**
 * Every class string the form controls share.
 */

export type FieldSize = 'sm' | 'default';

/** Whether a control is drawn as an error, and whether it is interactive at all. */
export interface FieldStateOptions {
	hasError?: boolean;
	disabled?: boolean;
	/** Draws the focus border even when focus is elsewhere - for a control whose panel is open. */
	active?: boolean;
}

/* ── Wrapper ─────────────────────────────────────────────────────────────── */

export const fieldWrapper = (disabled?: boolean) => cn('w-full', disabled && 'opacity-70');


/* ── Label ───────────────────────────────────────────────────────────────── */

/**
 * A static label above the control.
 */
export const fieldLabel = ({ hasError }: FieldStateOptions = {}) =>
	cn(
		'mb-1.5 block px-1 text-sm font-medium tracking-wide',
		hasError ? 'text-os-error' : 'text-os-text',
	);

/** `sm` controls are used inline, in table cells and rule rows, where a label has no room. */
export const showsLabel = (size: FieldSize) => size !== 'sm';


/* ── Control box ─────────────────────────────────────────────────────────── */

const SIZE_BOX: Record<FieldSize, string> = {
	sm: 'rounded-lg px-3 py-1.5 text-sm',
	default: 'rounded-xl px-4 py-2.5 text-sm',
};

/** The bordered box shared by inputs, textareas, and select triggers. */
export const fieldControl = (size: FieldSize, state: FieldStateOptions = {}) =>
	cn(
		'w-full appearance-none bg-os-surface text-os-text transition-all outline-none',
		'border focus:ring-0',
		SIZE_BOX[size],
		state.active
			? 'border-os-primary'
			: state.hasError
				? 'border-os-error focus:border-os-error'
				: 'border-os-border focus:border-os-primary',
		state.disabled && 'cursor-not-allowed',
	);

/**
 * Vertical padding for a control whose value is drawn as a badge rather than as bare text.
 *
 * A `default` badge is 4px taller than the `text-sm` line box the fields are sized around, so the box gives that 4px back and the control keeps the kit's height.
 */
export const fieldControlBadgeValue: Record<FieldSize, string> = {
	sm: 'py-1.5',
	default: 'py-2',
};


/* ── Adornments ──────────────────────────────────────────────────────────── */

const SIZE_ICON_INSET: Record<FieldSize, string> = {
	sm: 'left-2.5',
	default: 'left-4',
};

/** Extra left padding to clear a leading icon. Pair with {@link fieldLeftIcon}. */
export const fieldControlWithLeftIcon: Record<FieldSize, string> = {
	sm: 'pl-8',
	default: 'pl-12',
};

/** Extra right padding to clear trailing controls - a chevron, steppers, a swatch. */
export const fieldControlWithRightAdornment: Record<FieldSize, string> = {
	sm: 'pr-8',
	default: 'pr-10',
};

export const fieldLeftIcon = (size: FieldSize, state: FieldStateOptions = {}) =>
	cn(
		'pointer-events-none absolute top-1/2 -translate-y-1/2 transition-colors',
		SIZE_ICON_INSET[size],
		state.hasError
			? 'text-os-error'
			: state.active
				? 'text-os-primary'
				: 'text-os-text-muted peer-focus:text-os-primary',
	);

export const fieldRightAdornment = (size: FieldSize) =>
	cn(
		'absolute top-1/2 flex -translate-y-1/2 items-center gap-1',
		size === 'sm' ? 'right-3' : 'right-4',
	);


/* ── Error ───────────────────────────────────────────────────────────────── */

export const fieldError = 'mt-2 flex items-center gap-1.5 pl-2 text-sm font-medium text-os-error';

export const fieldErrorIconSize = 16;


/* ── Focus ring ──────────────────────────────────────────────────────────── */

/**
 * For a control whose real input is visually hidden - a checkbox or a switch - where the browser's own focus ring lands on something nobody can see.
 */
export const fieldFocusRing = 'ring-offset-2 ring-offset-os-bg ring-os-primary';


/* ── Help text ───────────────────────────────────────────────────────────── */

export const fieldHint = 'mt-1.5 block px-1 text-xs text-os-text-muted';
