import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups } from '@/modules/groups/types/groupRows.ts';
import { AddMembershipForm } from '@/modules/persons/components/membershipRow/AddMembershipForm.tsx';
import { MembershipRow } from '@/modules/persons/components/membershipRow/MembershipRow.tsx';
import { useMemberships } from '../hooks/useMemberships';


interface PersonGroupsModalProps {
	personId: string;
	personName: string;
}


/**
 * Every group one person has ever attended.
 */
export default function PersonGroupsModal({ personId, personName }: PersonGroupsModalProps) {
	const { hasPermission } = useAuth();
	const canModify = hasPermission('MODIFY_PERSONS');

	const memberships = useMemberships(personId);
	const groups = useGroups();

	const rows = memberships.data ?? [];
	const groupList = groups.data ?? [];
	const groupsById = indexGroups(groupList);

	if (memberships.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (memberships.isError) {
		return <Alert tone="danger">{ memberships.error.message }</Alert>;
	}

	return (
		<div className="mt-2 space-y-8">
			{ canModify && (
				<AddMembershipForm
					personId={ personId }
					groups={ groupList }
					memberships={ rows }
					groupsUnavailable={ !hasPermission('READ_GROUPS') || groups.isError }
				/>
			) }

			{ rows.length === 0 ? (
				<Alert tone="info">Ta osoba nie należy jeszcze do żadnej grupy.</Alert>
			) : (
				<ul className="space-y-2">
					{ rows.map((membership) => (
						<MembershipRow
							key={ membership.id }
							membership={ membership }
							group={ groupsById.get(membership.groupId) }
							personId={ personId }
							personName={ personName }
							canModify={ canModify }
						/>
					)) }
				</ul>
			) }
		</div>
	);
}
