import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { GroupForm } from '../components/groupForm/GroupForm';
import { useGroups } from '../hooks/useGroups';

interface GroupFormModalProps {
	/** The group to edit. Leave it out to fill in a new one. */
	groupId?: string;
	groupName?: string;
}

/**
 * Everything held about one group.
 */
export default function GroupFormModal({ groupId }: GroupFormModalProps) {
	if (groupId === undefined) {
		return <GroupForm/>;
	}

	return <EditGroupForm groupId={ groupId }/>;
}


function EditGroupForm({ groupId }: { groupId: string }) {
	const groups = useGroups();
	const group = groups.data?.find((candidate) => candidate.id === groupId);

	if (groups.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (group === undefined) {
		return <Alert tone="warning">Nie znaleziono tej grupy. Mogła zostać usunięta.</Alert>;
	}

	return <GroupForm key={ group.id } group={ group }/>;
}
