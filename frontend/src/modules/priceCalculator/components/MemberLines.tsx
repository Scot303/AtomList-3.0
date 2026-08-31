import { ArrowRight } from 'lucide-react';
import { TagBadge } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { formatCurrency, pluralise } from '@/lib/locale';
import { resolveGroupColor } from '@/modules/groups/types/groupRows.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { type DraftMember, entriesFor } from '../types/draft.ts';
import type { QuoteLine } from '../types/types.ts';


const MAX_ENTRIES = 12;


interface MemberLinesProps {
	member: DraftMember;
	groupsById: Map<string, GroupView>;
	/** The priced lines by group id, or null while this configuration has not been quoted. */
	pricedByGroup: Map<string, QuoteLine> | null;
	onEntriesChange: (groupId: string, entries: number) => void;
}


export function MemberLines({ member, groupsById, pricedByGroup, onEntriesChange }: MemberLinesProps) {
	if (member.groupIds.length === 0) {
		return null;
	}

	return (
		<ul className="overflow-hidden rounded-xl border border-os-border">
			{ member.groupIds.map((groupId) => {
				const group = groupsById.get(groupId);

				if (group === undefined) {
					return null;
				}

				return (
					<Line
						key={ groupId }
						group={ group }
						entries={ entriesFor(member, groupId) }
						priced={ pricedByGroup?.get(groupId) ?? null }
						onEntriesChange={ (entries) => onEntriesChange(groupId, entries) }
					/>
				);
			}) }
		</ul>
	);
}


interface LineProps {
	group: GroupView;
	entries: number;
	priced: QuoteLine | null;
	onEntriesChange: (entries: number) => void;
}


function Line({ group, entries, priced, onEntriesChange }: LineProps) {
	const perClass = group.billingType === 'PER_CLASS';
	const free = group.costForAttending === 0;

	const gross = priced?.gross ?? group.costForAttending * ( perClass ? entries : 1 );
	const net = priced?.amountToPay ?? null;
	const discounted = net !== null && net !== gross;

	return (
		<li className={ cn('flex items-center gap-3 border-b border-os-border/40 px-3 py-2 last:border-b-0', free && 'opacity-70') }>
			<span className="flex shrink-0 items-center gap-1">
				<TagBadge label={ group.name } color={ resolveGroupColor(group) }/>

				{ group.type === 'TOURNAMENT' && (
					<Tooltip content="Grupa turniejowa" className="shrink-0 items-center leading-none text-os-error">
						<span aria-hidden className="text-base leading-none font-bold">*</span>
						<span className="sr-only">Grupa turniejowa</span>
					</Tooltip>
				) }
			</span>

			{ perClass && (
				<div className="flex shrink-0 items-center ml-3 gap-1.5">
					<input
						type="number"
						min={ 0 }
						max={ MAX_ENTRIES }
						step={ 1 }
						aria-label={ `Liczba wejść - ${ group.name }` }
						value={ entries }
						onChange={ (event) => {
							const normalised = clampEntries(event.target.value);

							event.currentTarget.value = String(normalised);
							onEntriesChange(normalised);
						} }
						className="h-7 w-16 appearance-none rounded-md border border-os-border bg-os-surface px-2 text-right text-sm tabular-nums text-os-text outline-none transition-colors focus:border-os-primary ring-0"
					/>

					<span className="text-sm text-os-text-muted">{ pluralise(entries, 'wejście', 'wejścia', 'wejść') }</span>
				</div>
			) }

			<span className="ml-auto flex shrink-0 items-center justify-end gap-1.5">
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


function clampEntries(raw: string): number {
	const value = Number(raw);

	if (Number.isNaN(value)) {
		return 0;
	}

	return Math.min(Math.max(Math.trunc(value), 0), MAX_ENTRIES);
}
