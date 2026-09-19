import { ChevronLeft, ChevronRight } from 'lucide-react';


interface CalendarHeaderProps {
	/** The month and year on show - "wrzesień 2026". */
	title: string;
	picking: boolean;
	onTogglePicking: () => void;
	onStepMonth: (offset: number) => void;
}


export const CalendarHeader = ({ title, picking, onTogglePicking, onStepMonth }: CalendarHeaderProps) => (
	<div className="mb-3 flex items-center justify-between">
		{ picking
			? <Spacer/>
			: (
				<NavButton label="Poprzedni miesiąc" onClick={ () => onStepMonth(-1) }>
					<ChevronLeft size={ 16 }/>
				</NavButton>
			) }

		<button
			type="button"
			aria-expanded={ picking }
			onClick={ onTogglePicking }
			className="rounded-lg px-2 py-1 text-sm font-semibold text-os-text transition-colors outline-none hover:bg-white/4 hover:text-os-primary focus-visible:text-os-primary"
		>
			{ title }
		</button>

		{ picking
			? <Spacer/>
			: (
				<NavButton label="Następny miesiąc" onClick={ () => onStepMonth(1) }>
					<ChevronRight size={ 16 }/>
				</NavButton>
			) }
	</div>
);


/** Holds the title in the middle while the month arrows are away. */
const Spacer = () => <div aria-hidden className="size-7"/>;


const NavButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) => (
	<button
		type="button"
		aria-label={ label }
		onClick={ onClick }
		className="rounded-lg p-1.5 text-os-text-muted transition-colors outline-none hover:bg-white/4 hover:text-os-primary focus-visible:text-os-primary"
	>
		{ children }
	</button>
);
