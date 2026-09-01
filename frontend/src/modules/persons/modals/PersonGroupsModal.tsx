import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { cn } from '@/lib/cn.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups } from '@/modules/groups/types/groupRows.ts';
import { AddMembershipForm } from '@/modules/persons/components/membershipRow/AddMembershipForm.tsx';
import { MembershipRow } from '@/modules/persons/components/membershipRow/MembershipRow.tsx';
import { ROW_CARD_MOTION, ROW_MOTION } from '@/modules/persons/components/membershipRow/rowMotion.ts';
import { useMemberships } from '../hooks/queries/useMemberships.ts';
import type { MembershipView } from '../types/types.ts';


interface PersonGroupsModalProps {
	personId: string;
	personName: string;
}


const SHELL = 'mt-2 flex h-[70dvh] flex-col';


function byRunningThenNewest(a: MembershipView, b: MembershipView): number {
	if (a.active !== b.active) {
		return a.active ? -1 : 1;
	}

	if (a.joinedAt !== b.joinedAt) {
		return a.joinedAt < b.joinedAt ? 1 : -1;
	}

	return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}


/**
 * Every group one person has ever attended.
 */
export default function PersonGroupsModal({ personId, personName }: PersonGroupsModalProps) {
	const { hasPermission } = useAuth();
	const canModify = hasPermission('MODIFY_PERSONS');

	const memberships = useMemberships(personId);
	const groups = useGroups();

	const list = useRef<HTMLDivElement>(null);

	const rows = [...( memberships.data ?? [] )].sort(byRunningThenNewest);

	const groupList = groups.data ?? [];
	const groupsById = indexGroups(groupList);

	const revealNewest = () => list.current?.scrollTo({ top: 0 });

	if (memberships.isPending) {
		return (
			<div className={ cn(SHELL, 'items-center justify-center') }>
				<Spinner/>
			</div>
		);
	}

	if (memberships.isError) {
		return (
			<div className={ SHELL }>
				<Alert tone="danger">{ memberships.error.message }</Alert>
			</div>
		);
	}

	return (
		<div className={ SHELL }>
			{ canModify && (
				<div className="shrink-0 border-b border-os-border pb-6">
					<AddMembershipForm
						personId={ personId }
						groups={ groupList }
						memberships={ rows }
						groupsUnavailable={ !hasPermission('READ_GROUPS') || groups.isError }
						onCreated={ revealNewest }
					/>
				</div>
			) }

			<motion.div
				ref={ list }
				layoutScroll
				layoutRoot
				className={ cn(
					'themed-scrollbar -mr-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-4 scrollbar-gutter-stable',
					'scroll-smooth motion-reduce:scroll-auto',
					canModify && 'pt-6',
				) }
			>
				<ul className="relative flex flex-col gap-2">
					<AnimatePresence initial={ false } mode="popLayout">
						{ rows.length === 0 ? (
							<motion.li key="empty" { ...ROW_MOTION }>
								<motion.div { ...ROW_CARD_MOTION }>
									<Alert tone="info">Ta osoba nie należy jeszcze do żadnej grupy.</Alert>
								</motion.div>
							</motion.li>
						) : (
							rows.map((membership) => (
								<MembershipRow
									key={ membership.id }
									membership={ membership }
									group={ groupsById.get(membership.groupId) }
									personId={ personId }
									personName={ personName }
									canModify={ canModify }
								/>
							))
						) }
					</AnimatePresence>
				</ul>
			</motion.div>
		</div>
	);
}
