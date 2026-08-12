import type { ReactNode } from 'react';
import { useSelectPopover } from '@/hooks/useSelectPopover';
import { SelectPopover } from '@/components/ui/select';
import { ToolbarButton } from './ToolbarButton';

interface ToolbarPanelProps {
	icon: ReactNode;
	label: string;
	/** Lit up even when closed - for grouping, which stays on after the panel is dismissed. */
	active?: boolean;
	width?: string;
	title: string;
	children: (close: () => void) => ReactNode;
}

/**
 * A toolbar button with a panel hanging off it.
 */
export const ToolbarPanel = ({ icon, label, active, width = '15rem', title, children }: ToolbarPanelProps) => {
	const popover = useSelectPopover({ width });

	const { open, setReference, getReferenceProps, close } = popover;

	return (
		<>
			<ToolbarButton
				ref={ setReference }
				icon={ icon }
				label={ label }
				active={ active === true || open }
				aria-haspopup="dialog"
				aria-expanded={ open }
				{ ...getReferenceProps() }
			/>

			<SelectPopover popover={ popover }>
				<div role="dialog" aria-label={ title } className="popover-surface flex min-h-0 flex-col rounded-xl p-2">
					<div className="mb-1 border-b border-os-border px-2 py-1">
						<span className="text-sm font-semibold uppercase tracking-wide text-os-text-muted">{ title }</span>
					</div>

					<div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto">
						{ children(close) }
					</div>
				</div>
			</SelectPopover>
		</>
	);
};
