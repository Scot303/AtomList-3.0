import type { ReactNode, RefObject } from 'react';
import { OPTION_LIST_HEIGHT } from './calendarOptions';


interface OptionColumnProps {
	label: string;
	listRef: RefObject<HTMLDivElement | null>;
	onKeyDown: (event: React.KeyboardEvent) => void;
	children: ReactNode;
}


export const OptionColumn = ({ label, listRef, onKeyDown, children }: OptionColumnProps) => (
	<div
		ref={ listRef }
		role="listbox"
		aria-label={ label }
		tabIndex={ -1 }
		onKeyDown={ onKeyDown }
		style={ { height: OPTION_LIST_HEIGHT } }
		className="no-scrollbar overflow-y-auto overscroll-contain px-0.5 outline-none"
	>
		{ children }
	</div>
);
