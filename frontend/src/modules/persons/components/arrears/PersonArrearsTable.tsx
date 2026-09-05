import { ChargeLabel, ListCell } from '@/components/shared/ChargeCells';
import { TagBadgeOf } from '@/components/ui/tags';
import { formatCurrency } from '@/lib/locale';
import { SCOPE_TAGS } from '@/modules/deposits/types/depositRows.ts';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups } from '@/modules/groups/types/groupRows';
import { paymentListDetailPath } from '@/routes/paths.ts';
import type { OutstandingPaymentView } from '../../types/types.ts';


interface PersonArrearsTableProps {
	payments: OutstandingPaymentView[];
	linkLists?: boolean;
	onNavigate?: () => void;
}


/**
 * What one person still owes, line by line, oldest month first, with the account each debt is paid into.
 */
export function PersonArrearsTable({ payments, linkLists = false, onNavigate }: PersonArrearsTableProps) {
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);

	return (
		<div className="overflow-hidden rounded-xl border border-os-border">
			<table className="w-full table-auto border-collapse">
				<thead className="border-b border-os-border bg-os-surface/60 text-xs tracking-wide text-os-text-muted uppercase">
				<tr>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Płatność za
					</th>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Lista
					</th>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Konto
					</th>
					<th scope="col" className="px-3.5 py-2 text-left font-normal">
						Do zapłaty
					</th>
				</tr>
				</thead>

				<tbody className="divide-y divide-os-border/40">
				{ payments.map((line) => (
					<tr key={ line.paymentId } className="text-sm">
						<td className="min-w-0 px-3.5 py-2 align-baseline text-os-text-muted">
							<ChargeLabel groupId={ line.groupId } description={ line.description } groupsById={ groupsById }/>
						</td>

						<td className="min-w-0 px-3.5 py-2 items-center flex gap-1 text-os-text-muted">
							<ListCell
								year={ line.year }
								month={ line.month }
								tournamentList={ line.tournamentList }
								listName={ line.listName }
								closed={ line.listClosed }
								href={ linkLists ? paymentListDetailPath(line.listId) : undefined }
								onNavigate={ onNavigate }
							/>
						</td>

						<td className="px-3.5 py-2 align-baseline">
							<TagBadgeOf tag={ SCOPE_TAGS[line.tournamentList ? 'TOURNAMENT' : 'OPEN'] } size="sm"/>
						</td>

						<td className="px-3.5 py-2 align-baseline">
							<span className="font-semibold tabular-nums text-os-error">{ formatCurrency(line.outstanding) }</span>

							{ line.amountSettled > 0 && (
								<span className="block text-xs text-os-text-muted">
									opłacono juź { formatCurrency(line.amountSettled) } z { formatCurrency(line.amountToPay) }
								</span>
							) }
						</td>
					</tr>
				)) }
				</tbody>
			</table>
		</div>
	);
}
