import { Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import { DiscountLadder } from './DiscountLadder';
import { DiscountSection } from './DiscountSection';
import type { DiscountComponent, DiscountHousehold } from '../../types/types.ts';


/** What decides who sits where in the family, and so who gets which rung. */
const FAMILY_ORDER_HINT = 'Kolejność ustala stała miesięczna kwota - najdroższa osoba jest pierwsza, więc dostaje '
	+ 'najmniejszą zniżkę. Przy równych kwotach wygrywa dłuższy staż w studiu. Grupy rozliczane za wejście nie '
	+ 'wchodzą do tej kwoty, bo ich koszt zależy od obecności.';


interface FamilyDiscountSectionProps {
	component: DiscountComponent;
	household: DiscountHousehold | null;
}

/**
 * The part that comes from where in the family this person sits.
 */
export function FamilyDiscountSection({ component, household }: FamilyDiscountSectionProps) {
	const position = component.input;

	return (
		<DiscountSection
			icon={ <Users size={ 16 } aria-hidden/> }
			title="Zniżka rodzinna"
			percent={ component.percent }
			lead={ household === null
				? 'Bez rodziny, więc liczona jako pierwsza osoba w rodzinie.'
				: `Osoba na ${ position }. miejscu w rodzinie ${ household.familyName }.` }
		>
			{ household !== null && <HouseholdList household={ household }/> }

			<DiscountLadder
				component={ component }
				caption="Drabinka zniżek według miejsca w rodzinie"
				thresholdLabel={ (threshold) => `${ threshold }. osoba` }
				hint={ FAMILY_ORDER_HINT }
			/>
		</DiscountSection>
	);
}

/**
 * The household in the order the ladder put it, with the figure that order was decided on.
 */
function HouseholdList({ household }: { household: DiscountHousehold }) {
	return (
		<ul className="overflow-hidden rounded-xl border border-os-border">
			{ household.members.map((member) => (
				<li
					key={ member.personId }
					className={ cn(
						'flex items-center gap-3 border-b border-os-border/40 px-3 py-2 text-sm last:border-b-0',
						member.self && 'bg-os-primary/10',
						member.position === null && 'text-os-text-muted',
					) }
				>
					<span className="w-6 shrink-0 text-center font-mono text-sm text-os-text-muted">
						{ member.position === null ? '–' : `${ member.position }.` }
					</span>

					<span className={ cn('min-w-0 flex-1 truncate', member.self && 'font-medium text-os-text') }>
						{ member.fullName }
					</span>

					{ member.position === null ? (
						<span className="shrink-0 text-sm">Osoba nie jest rozliczana</span>
					) : (
						<span className="shrink-0 font-mono text-sm">{ formatCurrency(member.monthlyBase) } / miesięcznie</span>
					) }
				</li>
			)) }
		</ul>
	);
}
