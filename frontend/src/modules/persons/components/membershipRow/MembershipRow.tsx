import type { ReactNode } from 'react';
import { AlertTriangle, CalendarOff } from 'lucide-react';
import { DateCellPicker } from '@/components/ui/fields/DateCellPicker.tsx';
import { dateToISO, todayInTimeZone } from '@/components/ui/fields/dateUtils.ts';
import { TagBadge } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip.tsx';
import { cn } from '@/lib/cn.ts';
import { resolveGroupColor } from '@/modules/groups/types/groupRows.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { useMembershipActions } from './useMembershipActions.ts';
import type { MembershipView } from '../../types/types.ts';
import { formatShortDate } from '../../utils/personFormat.ts';
import { MembershipCostControl } from './MembershipCostControl.tsx';


interface MembershipRowProps {
	membership: MembershipView;
	group: GroupView | undefined;
	personId: string;
	personName: string;
	canModify: boolean;
}

/**
 * One membership, running or ended.
 */
export function MembershipRow(props: MembershipRowProps) {
	const { membership, group, personId, personName, canModify } = props;

	const { busy, handleLeave, handleContextMenu } = useMembershipActions({ membership, personId, personName, canModify });

	return (
		<li
			onContextMenu={ handleContextMenu }
			className={ cn(
				'styled-card rounded-2xl px-4 py-3 border-l-8 transition-colors will-change-transform',
				membership.active ? 'border-l-os-green' : 'border-l-os-border opacity-60'
			) }
		>
			<div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
				<GroupHeading membership={ membership } group={ group }/>

				<MembershipCostControl membership={ membership } personId={ personId } canModify={ canModify }/>

				{ canModify && membership.active && (
					<div className="lg:justify-self-end">
						<LeaveButton onLeave={ handleLeave } busy={ busy }/>
					</div>
				) }
			</div>
		</li>
	);
}

/**
 * Which group this is and for how long.
 */
function GroupHeading({ membership, group }: { membership: MembershipView; group: GroupView | undefined }) {
	const color = resolveGroupColor({ id: membership.groupId, color: group?.color ?? null });

	const groupRetired = group !== undefined && !group.active;

	return (
		<div className="flex min-w-0 flex-col items-start gap-2">
			<div className="flex min-w-0 max-w-full items-center gap-1">
				<TagBadge label={ membership.groupName } color={ color }/>

				{ membership.tournamentGroup && (
					<GroupMarker description="Grupa turniejowa" className="text-os-error">
						<span aria-hidden className="text-base leading-none font-bold">*</span>
					</GroupMarker>
				) }

				{ groupRetired && (
					<GroupMarker description="Grupa jest nieaktywna" className="text-os-warning">
						<AlertTriangle aria-hidden className="size-3.5"/>
					</GroupMarker>
				) }
			</div>

			<p className="text-sm text-os-text-muted pl-2">
				{ membership.leftAt === null
					? `od ${ formatShortDate(membership.joinedAt) }`
					: `${ formatShortDate(membership.joinedAt) } – ${ formatShortDate(membership.leftAt) }` }
			</p>
		</div>
	);
}

/**
 * A hint sitting next to the group's name.
 */
function GroupMarker({ description, className, children }: { description: string; className?: string; children: ReactNode }) {
	return (
		<Tooltip content={ description } className={ cn('shrink-0 items-center leading-none', className) }>
			{ children }
			<span className="sr-only">{ description }</span>
		</Tooltip>
	);
}

/**
 * Ends the membership on a day the user picks.
 */
function LeaveButton({ onLeave, busy }: { onLeave: (leftAt: string) => void; busy: boolean }) {
	return (
		<DateCellPicker
			value={ dateToISO(todayInTimeZone()) }
			onChange={ onLeave }
			showIcon={ false }
			className={ cn(
				'w-auto justify-center gap-2 rounded-xl border border-os-border-highlight bg-os-surface/25 px-4 py-2 font-bold text-os-text-muted shadow-md transition-all will-change-transform',
				'hover:bg-os-border/15 hover:text-os-text active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-os-primary/40',
				busy && 'pointer-events-none opacity-50',
			) }
		>
			<CalendarOff size={ 16 } aria-hidden className="shrink-0"/>
			Zakończ
		</DateCellPicker>
	);
}
