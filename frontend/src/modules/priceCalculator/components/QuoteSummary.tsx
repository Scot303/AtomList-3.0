import { ArrowRight, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency, formatPercent, pluralise } from '@/lib/locale';
import type { PriceQuoteView, QuoteMember } from '../types/types.ts';
import type { GrossTotals } from '../utils/grossTotals.ts';
import { QuoteLadders } from './QuoteLadders.tsx';
import { ScopeTotals } from '@/components/shared/ScopeTotals.tsx';


interface QuoteSummaryProps {
	gross: GrossTotals;
	quote: PriceQuoteView | null;
}


export function QuoteSummary({ gross, quote }: QuoteSummaryProps) {
	const saved = quote?.totals.total.discount ?? 0;

	return (
		<section className="styled-card space-y-4 rounded-2xl p-4" aria-label="Podsumowanie">
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
				<div className={ cn('min-w-0 space-y-4', quote === null && 'flex flex-col justify-center') }>
					{ quote === null ? (
						<p className="text-sm text-os-text-muted ml-1">
							Ceny bez zniżek. Naciśnij <span className="font-medium text-os-text">Wylicz ceny</span>, żeby zobaczyć, ile ta rodzina zapłaci po zniżkach.
						</p>
					) : (
						<>
							{ saved > 0 && (
								<p className="flex items-center gap-2 text-sm">
									<PiggyBank aria-hidden className="size-5 shrink-0 text-os-green"/>
									<span className="text-os-text-muted">Zniżki zdejmują</span>
									<span className="font-semibold text-os-green">{ formatCurrency(saved) }</span>
									<span className="text-os-text-muted">miesięcznie.</span>
								</p>
							) }

							<ul className="overflow-hidden rounded-xl border border-os-border">
								{ quote.members.map((member) => <MemberRow key={ member.index } member={ member }/>) }
							</ul>
						</>
					) }
				</div>

				<ScopeTotals
					gross={ gross }
					priced={ quote?.totals ?? null }
					title="Cała rodzina"
					className="self-start"
				/>
			</div>

			{ quote !== null && <QuoteLadders quote={ quote }/> }
		</section>
	);
}


function MemberRow({ member }: { member: QuoteMember }) {
	const gross = member.totals.total.gross;
	const net = member.totals.total.net;
	const discounted = net !== gross;

	return (
		<li className={ cn('flex items-center gap-3 border-b border-os-border/40 px-3 py-2 text-sm last:border-b-0', !member.billed && 'text-os-text-muted') }>
			<span className="w-20 shrink-0 font-medium">Osoba { member.index + 1 }</span>

			<span className="min-w-0 flex-1 truncate text-xs text-os-text-muted">{ describe(member) }</span>

			<span className={ cn('w-14 shrink-0 text-right text-sm', member.totalPercent > 0 ? 'font-semibold text-os-green' : 'text-os-text-muted') }>
				{ formatPercent(member.totalPercent) }
			</span>

			<span className="flex shrink-0 items-center justify-end gap-1.5">
				<span
					className={ cn(
						'w-24 text-right text-sm tabular-nums',
						discounted ? 'text-os-text-muted line-through decoration-os-text-muted/60' : 'text-os-text',
					) }
				>
					{ formatCurrency(gross) }
				</span>

				{ discounted && (
					<>
						<ArrowRight aria-hidden className="size-3.5 shrink-0 text-os-text-muted"/>
						<span className="text-sm font-semibold text-os-green tabular-nums">{ formatCurrency(net) }</span>
					</>
				) }
			</span>
		</li>
	);
}


function describe(member: QuoteMember): string {
	if (!member.billed) {
		return 'nie jest rozliczana';
	}

	const notes = [
		`${ member.familyPosition }. miejsce w rodzinie`,
		`${ member.groupCount } ${ pluralise(member.groupCount, 'grupa', 'grupy', 'grup') }`,
	];

	if (member.studentDiscount) {
		notes.push('student');
	}

	return notes.join(' · ');
}
