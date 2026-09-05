import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn.ts';
import { monthName, shiftMonth } from '@/utils/dateUtils.ts';


interface MonthSwitcherProps {
	year: number;
	month: number;
	onChange: (year: number, month: number) => void;
	onPrime?: (year: number, month: number) => void;
	className?: string;
}


/**
 * Which month the figures below are for, stepped one at a time.
 */
export function MonthSwitcher({ year, month, onChange, onPrime, className }: MonthSwitcherProps) {
	const previous = shiftMonth(year, month, -1);
	const next = shiftMonth(year, month, 1);

	return (
		<div className={ cn('flex items-center gap-1', className) }>
			<Arrow
				direction="previous"
				label={ `Pokaż ${ label(previous.year, previous.month) }` }
				onClick={ () => onChange(previous.year, previous.month) }
				onPrime={ () => onPrime?.(previous.year, previous.month) }
			/>

			<span aria-live="polite" className="min-w-38 text-center text-base font-semibold tabular-nums text-os-text">
				{ label(year, month) }
			</span>

			<Arrow
				direction="next"
				label={ `Pokaż ${ label(next.year, next.month) }` }
				onClick={ () => onChange(next.year, next.month) }
				onPrime={ () => onPrime?.(next.year, next.month) }
			/>
		</div>
	);
}


function label(year: number, month: number): string {
	return `${ monthName(month) } ${ year }`;
}


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
			<Icon size={ 16 } aria-hidden/>
		</button>
	);
};
