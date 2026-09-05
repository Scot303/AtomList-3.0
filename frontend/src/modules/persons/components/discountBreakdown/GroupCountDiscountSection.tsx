import { Users } from 'lucide-react';
import { TagBadge } from '@/components/ui/tags';
import { cn } from '@/lib/cn';
import { formatCurrency, pluralise } from '@/lib/locale';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { DiscountLadder } from './DiscountLadder';
import { DiscountSection } from './DiscountSection';
import type { CountedMembership, DiscountComponent } from '../../types/types.ts';


interface GroupCountDiscountSectionProps {
	component: DiscountComponent;
	memberships: CountedMembership[];
}


/**
 * The part that comes from how many groups this person is charged for.
 */
export function GroupCountDiscountSection({ component, memberships }: GroupCountDiscountSectionProps) {
	const count = component.input ?? 0;

	return (
		<DiscountSection
			icon={ <Users size={ 16 } aria-hidden/> }
			title="Zniżka za liczbę grup"
			percent={ component.percent }
			lead={ `Osoba jest rozliczana za ${ count } ${ groupWord(count) } w tym miesiącu.` }
		>
			{ memberships.length > 0 && <CountedMembershipList memberships={ memberships }/> }

			<DiscountLadder
				component={ component }
				caption="Drabinka zniżek według liczby grup"
				thresholdLabel={ (threshold) => `${ threshold } ${ groupWord(threshold) }` }
			/>
		</DiscountSection>
	);
}


/**
 * Every membership that ran at any point this month counts, whether or not it is still running, because the month was
 * charged for it. A group the person pays nothing for is listed too, but marked as counting towards nothing.
 */
function CountedMembershipList({ memberships }: { memberships: CountedMembership[] }) {
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);

	return (
		<ul className="overflow-hidden rounded-xl border border-os-border">
			{ memberships.map((membership) => (
				<li
					key={ membership.membershipId }
					className={ cn(
						'flex items-center gap-3 border-b border-os-border/40 px-3 py-2 text-sm last:border-b-0',
						!membership.counted && 'text-os-text-muted',
					) }
				>
					<span className="shrink-0">
						<TagBadge label={ membership.groupName } color={ membershipColor(membership, groupsById) }/>
					</span>

					<span className="min-w-0 flex-1 truncate text-os-text-muted">
						{ membershipNote(membership) }
					</span>

					<span className="shrink-0 font-mono text-sm">
						{ membership.perClass
							? 'rozliczana za wejście'
							: `${ formatCurrency(membership.unitCost) } / miesięcznie` }
					</span>
				</li>
			)) }
		</ul>
	);
}


/**
 * Why a membership is, or is not, part of the count.
 */
function membershipNote(membership: CountedMembership): string {
	const notes: string[] = [];

	if (!membership.current) {
		notes.push(membership.counted ? 'zakończona w tym miesiącu, ale nadal liczona' : 'zakończona w tym miesiącu');
	}

	if (!membership.counted) {
		notes.push('bez opłaty, nie liczy się do zniżki');
	}

	return notes.join(' · ');
}


function membershipColor(membership: CountedMembership, groupsById: Map<string, GroupView>): string {
	return resolveGroupColor({ id: membership.groupId, color: groupsById.get(membership.groupId)?.color ?? null });
}


function groupWord(count: number): string {
	return pluralise(count, 'grupa', 'grupy', 'grup');
}
