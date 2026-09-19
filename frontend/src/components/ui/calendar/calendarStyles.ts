import { cn } from '@/lib/cn';


/**
 * How a cell stands in relation to the choice being made.
 *
 * `pending` is the value the calendar opened on - the field's own, or today's - shown as a suggestion until the user has confirmed it themselves.
 */
export type OptionTone = 'selected' | 'pending' | 'current' | 'plain';


/**
 * The shared look of every pickable cell in the calendar - days, years, and months alike.
 */
export const optionClass = (tone: OptionTone, disabled = false) => cn(
	'rounded-lg text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-os-primary',
	tone === 'selected' && 'bg-os-primary font-semibold text-white',
	tone === 'pending' && 'bg-os-primary/10 font-semibold text-os-primary ring-1 ring-os-primary/40 ring-inset',
	tone === 'current' && 'border border-os-primary text-os-primary',
	tone === 'plain' && 'text-os-text hover:bg-white/3 hover:ring-1 ring-os-primary/30 ring-inset',
	disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
);
