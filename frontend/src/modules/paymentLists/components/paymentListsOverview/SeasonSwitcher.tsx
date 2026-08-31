import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn.ts';
import { formatSeason } from '../../types/seasons.ts';


interface SeasonSwitcherProps {
	/** The calendar year the season on screen opened in - 2026 for the 2026/2027 season. */
	startYear: number;
	onChange: (startYear: number) => void;
	/** Warms the neighboring season, so stepping onto it usually finds it already loaded. */
	onPrime?: (startYear: number) => void;
}


/**
 * Which season the month grid is showing.
 *
 * A season runs September to August, so it is named after both of the calendar years it spans.
 */
export const SeasonSwitcher = ({ startYear, onChange, onPrime }: SeasonSwitcherProps) => (
	<div className="flex items-center justify-center gap-2">
		<Arrow
			direction="previous"
			label={ `Pokaż sezon ${ formatSeason(startYear - 1) }` }
			onClick={ () => onChange(startYear - 1) }
			onPrime={ () => onPrime?.(startYear - 1) }
		/>

		<span aria-live="polite" className="min-w-32 text-center text-lg 2xl:text-xl 3xl:text-2xl font-bold tabular-nums text-os-text">
			{ formatSeason(startYear) }
		</span>

		<Arrow
			direction="next"
			label={ `Pokaż sezon ${ formatSeason(startYear + 1) }` }
			onClick={ () => onChange(startYear + 1) }
			onPrime={ () => onPrime?.(startYear + 1) }
		/>
	</div>
);


interface ArrowProps {
	direction: 'previous' | 'next';
	label: string;
	onClick: () => void;
	onPrime: () => void;
}


const Arrow = ({ direction, label, onClick, onPrime }: ArrowProps) => {
	const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;

	return (
		<button
			type="button"
			aria-label={ label }
			title={ label }
			onClick={ onClick }
			onMouseEnter={ onPrime }
			onFocus={ onPrime }
			className={ cn(
				'cursor-pointer rounded-lg p-1.5 text-os-text-muted transition-colors outline-none',
				'hover:bg-os-bg-highlight hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary/60',
			) }
		>
			<Icon size={ 16 } className="h-4 w-4 2xl:h-5 2xl:w-5 3xl:h-6 3xl:w-6" aria-hidden/>
		</button>
	);
};
