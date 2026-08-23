import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';


interface DepositsToolbarProps {
	year: number;
	/** Whether the table is showing every handover ever recorded rather than one year. */
	allYears: boolean;
	onYearChange: (year: number) => void;
	onAllYearsChange: (allYears: boolean) => void;
}


export function DepositsToolbar(props: DepositsToolbarProps) {
	const { year, allYears, onYearChange, onAllYearsChange } = props;

	const openModal = useModalStore((state) => state.openModal);

	const step = (delta: number) => {
		onAllYearsChange(false);
		onYearChange(year + delta);
	};

	return (
		<div className="ml-10 flex items-center gap-2">
			<div className="flex items-center gap-1">
				<Arrow direction="previous" label={ `Pokaż rok ${ year - 1 }` } onClick={ () => step(-1) }/>

				<span
					aria-live="polite"
					className={ cn(
						'min-w-14 text-center text-base font-bold tabular-nums',
						allYears ? 'text-os-text-muted' : 'text-os-text',
					) }
				>
					{ year }
				</span>

				<Arrow direction="next" label={ `Pokaż rok ${ year + 1 }` } onClick={ () => step(1) }/>
			</div>

			<Tooltip
				content="Pokaż wszystkie wpłaty w systemie"
				focusable={ false }
			>
				<button
					type="button"
					aria-pressed={ allYears }
					onClick={ () => onAllYearsChange(!allYears) }
					className={ cn(
						'shrink-0 rounded-lg border px-2.5 py-1.5 text-sm font-semibold tracking-wide transition-colors outline-none',
						'focus-visible:ring-2 focus-visible:ring-os-primary/40',
						allYears
							? 'border-os-primary/50 bg-os-primary/10 text-os-primary'
							: 'border-os-border text-os-text-muted hover:bg-white/3',
					) }
				>
					Wszystkie
				</button>
			</Tooltip>

			<Button
				variant="secondary"
				size="md"
				className="ml-10 shrink-0 py-1.5"
				leftIcon={ <Search size={ 14 }/> }
				onMouseEnter={ () => preloadModal('deposits.find') }
				onFocus={ () => preloadModal('deposits.find') }
				onClick={ () => void openModal('deposits.find') }
			>
				Znajdź po nr
			</Button>
		</div>
	);
}


const Arrow = ({ direction, label, onClick }: { direction: 'previous' | 'next'; label: string; onClick: () => void }) => {
	const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;

	return (
		<button
			type="button"
			aria-label={ label }
			title={ label }
			onClick={ onClick }
			className={ cn(
				'cursor-pointer rounded-lg p-1 text-os-text-muted transition-colors outline-none',
				'hover:bg-os-bg-highlight hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary/60',
			) }
		>
			<Icon size={ 20 } aria-hidden/>
		</button>
	);
};
