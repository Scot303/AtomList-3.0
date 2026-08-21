import { cn } from '@/lib/cn';


/** Money arriving now, or what is left of money that arrived earlier. */
export type SettleMode = 'fresh' | 'credit';


interface SettleModeSwitchProps {
	mode: SettleMode;
	onChange: (mode: SettleMode) => void;
	/** How many earlier handovers still have credit to spend, so the tab can say so. */
	creditCount: number;
}


export function SettleModeSwitch({ mode, onChange, creditCount }: SettleModeSwitchProps) {
	const options: { id: SettleMode; label: string }[] = [
		{ id: 'fresh', label: 'Nowa wpłata' },
		{ id: 'credit', label: `Z poprzednich wpłat (${ creditCount })` },
	];

	return (
		<div role="tablist" className="flex justify-center gap-1.5 mb-8">
			{ options.map((option) => {
				const active = mode === option.id;

				return (
					<button
						key={ option.id }
						type="button"
						role="tab"
						aria-selected={ active }
						onClick={ () => onChange(option.id) }
						className={ cn(
							'shrink-0 rounded-lg border px-3 py-1.5 text-sm font-semibold tracking-wide transition-colors outline-none',
							'focus-visible:ring-2 focus-visible:ring-os-primary/40',
							active
								? 'border-os-primary/50 bg-os-primary/5 text-os-primary'
								: 'border-os-border text-os-text-muted hover:bg-white/3',
						) }
					>
						{ option.label }
					</button>
				);
			}) }
		</div>
	);
}
