import { TagBadge } from '@/components/ui/tags';
import type { Role } from '@/types/auth';
import { ROLE_COLORS, ROLE_LABELS } from '../types/constants.ts';
import type { AdminUserView } from '../types/types.ts';
import { UserRow } from './UserRow';

interface UserRoleGroupProps {
	role: Role;
	users: AdminUserView[];
	/** Marks the administrator's own row, which several edits are refused on. */
	currentUserId: string | undefined;
}

export function UserRoleGroup({ role, users, currentUserId }: UserRoleGroupProps) {
	return (
		<section aria-labelledby={ `role-${ role }` }>
			<h2 id={ `role-${ role }` } className="mb-3 flex items-center gap-2 px-1">
				<TagBadge label={ ROLE_LABELS[role] } color={ ROLE_COLORS[role] }/>
				<span className="text-sm text-os-text-muted">{ users.length }</span>
			</h2>

			<ul className="space-y-3">
				{ users.map((user) => (
					<UserRow key={ user.id } user={ user } isSelf={ user.id === currentUserId }/>
				)) }
			</ul>
		</section>
	);
}
