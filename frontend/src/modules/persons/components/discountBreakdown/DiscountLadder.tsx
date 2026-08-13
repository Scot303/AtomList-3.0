import { Info } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/locale';
import type { DiscountComponent } from '../../types/types.ts';


interface DiscountLadderProps {
	component: DiscountComponent;
	caption: string;
	thresholdLabel: (threshold: number) => string;
	/** How the rungs are ordered, kept out of the way until asked for. */
	hint?: string;
}

/**
 * Every configured rung, with the matched one marked.
 */
export function DiscountLadder({ component, caption, thresholdLabel, hint }: DiscountLadderProps) {
	if (component.ladder.length === 0) {
		return (
			<Alert tone="info" className="mt-1">
				Ta drabinka nie ma jeszcze żadnego progu, więc nie jest brana pod uwagę.
			</Alert>
		);
	}

	const note = ladderNote(component, thresholdLabel);

	return (
		<div className="space-y-2 mt-5 mb-8">
			<div className="flex items-center gap-1.5">
				<p className="text-sm tracking-wide text-os-text uppercase">{ caption }</p>

				{ hint !== undefined && (
					<Tooltip
						content={ hint }
						className="items-center text-os-text-muted transition-colors hover:text-os-primary"
					>
						<Info className="size-4.5" aria-hidden="true"/>
						<span className="sr-only">{ hint }</span>
					</Tooltip>
				) }
			</div>

			<ul className="flex flex-wrap gap-2">
				{ component.ladder.map((rung) => (
					<li
						key={ rung.threshold }
						className={ cn(
							'flex items-baseline gap-2 rounded-lg border px-2.5 py-1 text-sm',
							rung.applied
								? 'border-os-primary/50 bg-os-primary/15 text-os-text'
								: 'border-os-border text-os-text',
						) }
					>
						<span>{ thresholdLabel(rung.threshold) }</span> -
						<span>{ formatPercent(rung.percent) }</span>
					</li>
				)) }
			</ul>

			{ note !== null && <p className="text-sm text-os-text-muted">{ note }</p> }
		</div>
	);
}

/**
 * Why the marked rung is the one that answered, when that is not obvious from the ladder alone.
 */
function ladderNote(component: DiscountComponent, thresholdLabel: (threshold: number) => string): string | null {
	if (component.matchedThreshold === null) {
		return 'Żaden próg nie jest ustawiony na tej wysokości ani niżej, więc ta część wynosi 0%.';
	}

	const beyondLadder = component.input !== null && component.matchedThreshold < component.input;

	if (!beyondLadder) {
		return null;
	}

	return `Drabinka kończy się wcześniej, więc obowiązuje jej ostatni próg (${ thresholdLabel(component.matchedThreshold) }).`;
}
