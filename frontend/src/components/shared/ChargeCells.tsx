import { Link } from 'react-router';
import { Lock } from 'lucide-react';
import { TagBadge } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { describeSheet } from '@/modules/deposits/types/sheetLabels.ts';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows.ts';


interface ChargeLabelProps {
	/** The billed group, or null for an ad-hoc charge. */
	groupId: string | null;
	description: string | null;
	groupsById: ReturnType<typeof indexGroups>;
}


/**
 * What a charge is for: a billed group keeps its own tag color, an ad-hoc one keeps the typed description.
 */
export function ChargeLabel({ groupId, description, groupsById }: ChargeLabelProps) {
	const group = groupId === null ? undefined : groupsById.get(groupId);

	return group === undefined
		? description
		: <TagBadge label={ group.name } color={ resolveGroupColor(group) } size="sm"/>;
}


interface ListCellProps {
	year: number | null;
	month: number | null;
	tournamentList: boolean;
	listName?: string | null;
	closed: boolean;
	/** Set to turn the sheet into a link to it. Left out where the reader has no business opening the list. */
	href?: string;
	/** Called when that link is followed - for a modal that has to get out of the way first. */
	onNavigate?: () => void;
}


/**
 * Which sheet a charge sits on, and whether that sheet has been closed.
 */
export function ListCell({ year, month, tournamentList, listName, closed, href, onNavigate }: ListCellProps) {
	const label = describeSheet(year, month, tournamentList, listName);

	return (
		<span className="inline-flex items-center gap-1.5">
			{ href === undefined ? label : (
				<Link
					to={ href }
					onClick={ onNavigate }
					className="underline decoration-dotted underline-offset-2 transition-colors hover:text-os-primary"
				>
					{ label }
				</Link>
			) }

			{ closed && (
				<Tooltip content="Lista zamknięta">
					<Lock aria-label="Lista zamknięta" size={ 14 } className="shrink-0 text-os-warning"/>
				</Tooltip>
			) }
		</span>
	);
}
