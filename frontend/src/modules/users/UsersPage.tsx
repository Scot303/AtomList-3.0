import { UserPlus } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { Button } from '@/components/ui/buttons/Button';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useModalStore } from '@/stores/modalStore';
import { UserRoleGroup } from './components/UserRoleGroup';
import { groupUsersByRole } from './types/grouping.ts';
import { useAdminUsers } from './hooks/useAdminUsers';

/**
 * Account administration: every account, grouped by role, each editable in place.
 */
export function UsersPage() {
	const { user } = useAuth();
	const openModal = useModalStore((state) => state.openModal);
	const { data, isPending, isError, error } = useAdminUsers();

	if (isPending) {
		return (
			<div className="h-[70vh]">
				<FullPageLoader/>
			</div>
		);
	}

	if (isError) {
		return <Alert tone="danger">{ error.message }</Alert>;
	}

	const groups = groupUsersByRole(data);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-end">
				<Button
					size="md"
					className="shrink-0"
					leftIcon={ <UserPlus size={ 16 }/> }
					onClick={ () => void openModal('users.create') }
				>
					Dodaj konto
				</Button>
			</div>

			{ groups.length === 0 ? (
				<Alert tone="info">Nie powinno Cię tu być :)</Alert>
			) : (
				<div className="space-y-8">
					{ groups.map((group) => (
						<UserRoleGroup
							key={ group.role }
							role={ group.role }
							users={ group.users }
							currentUserId={ user?.id }
						/>
					)) }
				</div>
			) }
		</div>
	);
}
