import type { ReactNode } from 'react';
import { GraduationCap, Users, UsersRound } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { cn } from '@/lib/cn';
import { formatPercent, pluralise } from '@/lib/locale';
import type { PriceQuoteView, QuoteMember, QuoteRung } from '../types/types.ts';


interface QuoteLaddersProps {
	quote: PriceQuoteView;
}


export function QuoteLadders({ quote }: QuoteLaddersProps) {
	const familyHits = hits(quote, (member) => member.familyThreshold);
	const groupCountHits = hits(quote, (member) => member.groupCountThreshold);
	const students = quote.members.filter((member) => member.billed && member.studentDiscount).map((member) => member.index);

	return (
		<div className="space-y-4">
			<Ladder
				icon={ <Users aria-hidden className="size-4"/> }
				caption="Zniżka według miejsca w rodzinie"
				rungs={ quote.familyLadder }
				hitsByThreshold={ familyHits }
				label={ (threshold) => `${ threshold }. miejsce` }
			/>

			<Ladder
				icon={ <UsersRound aria-hidden className="size-4"/> }
				caption="Zniżka według liczby grup"
				rungs={ quote.groupCountLadder }
				hitsByThreshold={ groupCountHits }
				label={ (threshold) => `${ threshold } ${ pluralise(threshold, 'grupa', 'grupy', 'grup') }` }
			/>

			<section className="space-y-2">
				<Caption icon={ <GraduationCap aria-hidden className="size-4"/> } text="Zniżka studencka"/>

				<ul className="flex flex-wrap gap-2">
					<Rung
						label="status studenta"
						percent={ quote.studentDiscountPercent }
						holders={ students }
					/>
				</ul>
			</section>
		</div>
	);
}


interface LadderProps {
	icon: ReactNode;
	caption: string;
	rungs: QuoteRung[];
	hitsByThreshold: Map<number, number[]>;
	label: (threshold: number) => string;
}


function Ladder({ icon, caption, rungs, hitsByThreshold, label }: LadderProps) {
	return (
		<section className="space-y-2">
			<Caption icon={ icon } text={ caption }/>

			{ rungs.length === 0 ? (
				<Alert tone="info">Ta drabinka nie ma jeszcze żadnego progu, więc nie jest brana pod uwagę.</Alert>
			) : (
				<ul className="flex flex-wrap gap-2">
					{ rungs.map((rung) => (
						<Rung
							key={ rung.threshold }
							label={ label(rung.threshold) }
							percent={ rung.percent }
							holders={ hitsByThreshold.get(rung.threshold) ?? [] }
						/>
					)) }
				</ul>
			) }
		</section>
	);
}


function Caption({ icon, text }: { icon: ReactNode; text: string }) {
	return (
		<p className="flex items-center gap-2 text-sm tracking-wide text-os-text-muted uppercase">
			<span className="text-os-text-muted">{ icon }</span>
			{ text }
		</p>
	);
}


interface RungProps {
	label: string;
	percent: number;
	/** The indexes of the people this rung answered for. Empty means nobody in this household landed on it. */
	holders: number[];
}


function Rung({ label, percent, holders }: RungProps) {
	const applied = holders.length > 0;

	return (
		<li
			className={ cn(
				'flex items-baseline gap-2 rounded-lg border px-2.5 py-1 text-sm',
				applied ? 'border-os-primary/50 bg-os-primary/15 text-os-text' : 'border-os-border text-os-text-muted',
			) }
		>
			<span>{ label }</span>
			<span>-</span>
			<span className={ cn(applied && 'font-semibold') }>{ formatPercent(percent) }</span>

			{ applied && (
				<span className="text-xs text-os-text-muted">
					({ holders.map((index) => `Osoba ${ index + 1 }`).join(', ') })
				</span>
			) }
		</li>
	);
}


/**
 * Which people landed on each threshold of one ladder.
 */
function hits(quote: PriceQuoteView, thresholdOf: (member: QuoteMember) => number | null): Map<number, number[]> {
	const byThreshold = new Map<number, number[]>();

	for (const member of quote.members) {
		const threshold = thresholdOf(member);

		if (!member.billed || threshold === null) {
			continue;
		}

		const holders = byThreshold.get(threshold);

		if (holders === undefined) {
			byThreshold.set(threshold, [member.index]);
		} else {
			holders.push(member.index);
		}
	}

	return byThreshold;
}
