import type { ReactNode } from 'react';
import { cn } from '@/lib/cn.ts';
import { formatCurrency } from '@/lib/locale.ts';


type Tone = 'default' | 'muted' | 'good' | 'bad' | 'strong';

const TONES: Record<Tone, string> = {
	default: 'text-os-text',
	muted: 'text-os-text-muted',
	good: 'text-os-green',
	bad: 'text-os-error',
	strong: 'font-medium text-os-text',
};


interface MoneyLineProps {
	label: string;
	amount: number;
	tone?: Tone;
	suffix?: ReactNode;
	/** Draws a rule above, to separate a total from what it is made of. */
	separated?: boolean;
}


/**
 * One labelled figure, with the amounts of a group lining up under each other.
 */
export function MoneyLine({ label, amount, tone = 'default', suffix, separated }: MoneyLineProps) {
	return (
		<div className={ cn('flex items-baseline justify-between gap-3 py-1', separated && 'mt-1 border-t border-os-border/80 pt-2') }>
			<span className="min-w-0 truncate text-sm text-os-text-muted">{ label }</span>

			<span className={ cn('shrink-0 text-sm font-medium tabular-nums', TONES[tone]) }>
				{ formatCurrency(amount) }
				{ suffix }
			</span>
		</div>
	);
}


interface TextLineProps {
	label: string;
	children: ReactNode;
	separated?: boolean;
}


/**
 * The same shape for something that is not money - a date, a method, a code.
 */
export function TextLine({ label, children, separated }: TextLineProps) {
	return (
		<div className={ cn('flex items-baseline justify-between gap-3 py-1', separated && 'mt-1 border-t border-os-border/60 pt-2') }>
			<span className="min-w-0 truncate text-sm text-os-text-muted">{ label }</span>
			<span className="shrink-0 text-sm text-os-text">{ children }</span>
		</div>
	);
}


/**
 * A titled panel the lines sit in.
 */
export function LinePanel({ title, className, children }: { title?: string; className?: string; children: ReactNode }) {
	return (
		<div className="space-y-2">
			{ title !== undefined && (
				<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">{ title }</h3>
			) }
			<div className={ cn('styled-card rounded-2xl px-4 py-3', className) }>
				{ children }
			</div>
		</div>
	);
}
