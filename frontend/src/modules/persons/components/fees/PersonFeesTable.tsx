import { ArrowRight } from 'lucide-react';
import { TagBadge, TagBadgeOf } from '@/components/ui/tags';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import { SCOPE_TAGS } from '@/modules/deposits/types/depositRows.ts';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows';
import type { CountedMembership } from '../../types/types.ts';


interface PersonFeesTableProps {
	memberships: CountedMembership[];
}


/**
 * What each of this person's groups bills them for the month, before and after their discount.
 */
export function PersonFeesTable({ memberships }: PersonFeesTableProps) {
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);

	return (
		<div className="overflow-hidden rounded-xl border border-os-border">
			<table className="w-full table-auto border-collapse">
				<thead className="border-b border-os-border bg-os-surface/60 text-xs tracking-wide text-os-text-muted uppercase">
				<tr>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Grupa
					</th>

					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Konto
					</th>

					<th scope="col" className="px-3.5 py-2 text-right font-normal">
						Stała miesięczna opłata
					</th>
				</tr>
				</thead>

				<tbody className="divide-y divide-os-border/40">
				{ memberships.map((membership) => (
					<tr key={ membership.membershipId } className={ cn('text-sm', !membership.counted && 'text-os-text-muted') }>
						<td className="min-w-0 px-3.5 py-2 align-baseline">
							<TagBadge
								label={ membership.groupName }
								color={ resolveGroupColor({ id: membership.groupId, color: groupsById.get(membership.groupId)?.color ?? null }) }
								size="sm"
							/>

							{ note(membership) !== '' && (
								<span className="block pt-0.5 text-xs text-os-text-muted">{ note(membership) }</span>
							) }
						</td>

						<td className="px-3.5 py-2 align-baseline">
							<TagBadgeOf tag={ SCOPE_TAGS[membership.type] } size="sm"/>
						</td>

						<td className="px-3.5 py-2 text-right align-baseline">
							{ membership.perClass ? (
								<span className="tabular-nums text-os-text-muted">
									{ formatCurrency(membership.unitCost) } <span className="text-xs">za wejście</span>
								</span>
							) : (
								<Amount gross={ membership.gross } net={ membership.amountToPay }/>
							) }
						</td>
					</tr>
				)) }
				</tbody>
			</table>
		</div>
	);
}


/**
 * The rate, with the undiscounted figure struck through wherever the discount moved it.
 */
function Amount({ gross, net }: { gross: number; net: number }) {
	if (net === gross) {
		return <span className="font-semibold tabular-nums text-os-text">{ formatCurrency(gross) }</span>;
	}

	return (
		<span className="inline-flex items-center justify-end gap-1.5">
			<span className="tabular-nums text-os-text-muted line-through decoration-os-text-muted/60">{ formatCurrency(gross) }</span>

			<ArrowRight aria-hidden className="size-3.5 shrink-0 text-os-text-muted"/>

			<span className="font-semibold tabular-nums text-os-green">{ formatCurrency(net) }</span>
		</span>
	);
}


/**
 * Why a row reads the way it does, where that is not obvious from the figures.
 */
function note(membership: CountedMembership): string {
	const notes: string[] = [];

	if (!membership.current) {
		notes.push('zakończona w tym miesiącu, ale rozliczana');
	}

	if (!membership.counted) {
		notes.push('bez opłaty, nie liczy się do zniżki');
	}

	return notes.join(' · ');
}
