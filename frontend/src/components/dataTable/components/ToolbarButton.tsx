import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';


interface ToolbarButtonProps {
	icon: ReactNode;
	label: string;
	/** Lit up, for a toggle that is on or a panel that is open. */
	active?: boolean;
	/** A small count beside the label, e.g. how many filters are applied. */
	badge?: number;
	onClick?: () => void;
	ref?: Ref<HTMLButtonElement>;
	'aria-expanded'?: boolean;
	'aria-haspopup'?: 'dialog' | 'menu' | 'listbox';
	'aria-pressed'?: boolean;
}


/**
 * The one button shape the table's toolbar uses, so the filter toggle and the panel triggers cannot drift apart.
 * The label hides below `sm`, leaving the icon.
 */
export const ToolbarButton = ({ icon, label, active, badge, onClick, ref, ...aria }: ToolbarButtonProps) => (
	<button
		ref={ ref }
		type="button"
		onClick={ onClick }
		{ ...aria }
		className={ cn(
			'flex items-center gap-1.5 rounded-lg border bg-os-surface px-2.5 py-1.5 text-sm font-semibold transition-colors outline-none',
			'focus-visible:border-os-primary',
			active
				? 'border-os-primary/50 bg-os-primary/10 text-os-primary'
				: 'border-os-border text-os-text-muted hover:border-os-border-highlight hover:text-os-text',
		) }
	>
		<span className="shrink-0">{ icon }</span>
		<span className="hidden sm:inline">{ label }</span>

		{ badge !== undefined && badge > 0 && (
			<span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-os-border/50 text-[10px] font-bold leading-none text-os-text-muted">
				{ badge }
			</span>
		) }
	</button>
);
