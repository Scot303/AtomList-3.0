import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn.ts';


interface YearSwitcherProps {
	year: number;
	onChange: (year: number) => void;
	/** Warms the neighboring year, so stepping onto it usually finds it already loaded. */
	onPrime?: (year: number) => void;
}


/**
 * Which year the month grid is showing.
 */
export const YearSwitcher = ({ year, onChange, onPrime }: YearSwitcherProps) => (
	<div className="flex items-center justify-center gap-2">
		<Arrow
			direction="previous"
			label={ `Pokaż rok ${ year - 1 }` }
			onClick={ () => onChange(year - 1) }
			onPrime={ () => onPrime?.(year - 1) }
		/>

		<span aria-live="polite" className="min-w-20 text-center text-lg 2xl:text-xl 3xl:text-2xl font-bold tabular-nums text-os-text">
			{ year }
		</span>

		<Arrow
			direction="next"
			label={ `Pokaż rok ${ year + 1 }` }
			onClick={ () => onChange(year + 1) }
			onPrime={ () => onPrime?.(year + 1) }
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
