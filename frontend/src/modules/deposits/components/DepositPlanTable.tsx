import { ChargeLabel, ListCell } from '@/components/shared/ChargeCells';
import { formatCurrency } from '@/lib/locale';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups } from '@/modules/groups/types/groupRows';
import type { PlannedSettlementView } from '../types/types.ts';


interface DepositPlanTableProps {
	settlements: PlannedSettlementView[];
}


/**
 * Where the money would go, line by line, before any of it is written.
 */
export function DepositPlanTable({ settlements }: DepositPlanTableProps) {
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);

	return (
		<div className="overflow-hidden rounded-xl border border-os-border">
			<table className="w-full table-auto border-collapse">
				<thead className="border-b border-os-border bg-os-surface/60 text-xs tracking-wide text-os-text-muted uppercase">
				<tr>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Osoba
					</th>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Płatność za
					</th>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Lista
					</th>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Kwota
					</th>
				</tr>
				</thead>

				<tbody className="divide-y divide-os-border/40">
				{ settlements.map((line) => (
					<tr key={ line.paymentId } className="text-sm">
						<td className="min-w-0 px-3.5 py-2 align-baseline text-os-text">{ line.personName }</td>

						<td className="min-w-0 px-3.5 py-2 align-baseline text-os-text-muted">
							<ChargeLabel groupId={ line.groupId } description={ line.description } groupsById={ groupsById }/>
						</td>

						<td className="min-w-0 px-3.5 py-2 items-center flex gap-1 text-os-text-muted">
							<ListCell year={ line.year } month={ line.month } tournamentList={ line.tournamentList } closed={ line.listClosed }/>
						</td>

						<td className="px-3.5 py-2 align-baseline">
							<span className="font-semibold tabular-nums text-os-text">{ formatCurrency(line.amount) }</span>

							{ line.partial && <span className="block text-xs text-os-warning">pozostanie { formatCurrency(line.remainingAfter) }</span> }
						</td>
					</tr>
				)) }
				</tbody>
			</table>
		</div>
	);
}
