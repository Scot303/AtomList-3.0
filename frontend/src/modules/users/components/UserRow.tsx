import type { ReactNode } from 'react';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Lock } from 'lucide-react';
import type { ExtendedSelectOption } from '@/components/ui/extendedSelect';
import { ExtendedCellSelect } from '@/components/ui/extendedSelect';
import { TagCellSelect } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip.tsx';
import { cn } from '@/lib/cn';
import { notifyApiError } from '@/lib/toast';
import { useConfirm } from '@/stores/dialogStore';
import type { Permission, Role } from '@/types/auth';
import { ACTIVE_ID, INACTIVE_ID } from '@/types/rowTags.ts';
import { ACTIVE_OPTIONS, PERMISSION_OPTIONS, ROLE_OPTIONS } from '../types/constants.ts';
import { useUpdateUser } from '../hooks/useAdminUserMutations';
import type { AdminUserView, UpdateUserPayload } from '../types/types.ts';
import { UserRowActions } from './UserRowActions';


interface UserRowProps {
	user: AdminUserView;
	/** The signed-in administrator's own row. The backend refuses several of these edits on it. */
	isSelf: boolean;
}


export function UserRow({ user, isSelf }: UserRowProps) {
	const updateUser = useUpdateUser();
	const confirm = useConfirm();

	const save = (payload: UpdateUserPayload) => {
		updateUser.mutate({ id: user.id, payload }, { onError: notifyApiError });
	};

	const handleRoleChange = async (roleId: string | undefined) => {
		if (roleId === undefined || roleId === user.role) {
			return;
		}

		const confirmed = await confirm({
			title: 'Zmienić rolę?',
			message: `Rola konta ${ user.username } zostanie zmieniona. Wszystkie aktywne sesje tego konta zostaną zakończone.`,
			confirmText: 'Zmień rolę',
			variant: 'warning',
		});

		if (confirmed) {
			save({ role: roleId as Role });
		}
	};

	const handleActiveChange = async (statusId: string | undefined) => {
		if (statusId === undefined) {
			return;
		}

		const active = statusId === ACTIVE_ID;

		if (active === user.active) {
			return;
		}

		if (!active) {
			const confirmed = await confirm({
				title: 'Dezaktywować konto?',
				message: `Konto ${ user.username } straci możliwość logowania, a wszystkie jego sesje zostaną zakończone.`,
				confirmText: 'Dezaktywuj',
				variant: 'danger',
			});

			if (!confirmed) {
				return;
			}
		}

		save({ active });
	};

	/**
	 * Whatever the role grants is shown but locked - it cannot be taken away here.
	 */
	const inherited = new Set(
		user.effectivePermissions.filter((permission) => !user.additionalPermissions.includes(permission)),
	);

	const permissionOptions: ExtendedSelectOption[] = PERMISSION_OPTIONS.map((option) =>
		inherited.has(option.id as Permission) ? { ...option, disabled: true, hint: 'z roli' } : option,
	);

	return (
		<li className={ cn('styled-card rounded-2xl px-4 py-3', !user.active && 'opacity-60') }>
			<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-5">
				<div className="min-w-0 xl:w-64 xl:shrink-0">
					<div className="flex min-w-0 items-center gap-1.5">
						<span className="truncate font-semibold text-os-text">{ user.username }</span>

						{ user.locked && (
							<StatusIcon
								icon={ Lock }
								className="text-os-error"
								description={
									user.lockedUntil === null
										? 'Konto zablokowane bezterminowo - użytkownik nie może się zalogować.'
										: `Konto zablokowane do ${ format(new Date(user.lockedUntil), 'dd.MM.yyyy HH:mm') } - do tego czasu użytkownik nie może się zalogować.`
								}
							/>
						) }
					</div>

					<div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-os-text-muted">
						<span className="truncate">{ user.email }</span>

						{ !user.emailVerified && (
							<StatusIcon
								icon={ AlertTriangle }
								className="text-os-warning"
								description="E-mail niepotwierdzony - użytkownik nie potwierdził swojego adresu e-mail."
							/>
						) }
					</div>
				</div>

				<RowField label="Rola" className="xl:w-44 xl:shrink-0">
					<TagCellSelect
						options={ ROLE_OPTIONS }
						value={ user.role }
						onChange={ handleRoleChange }
						disabled={ isSelf }
						ariaLabel={ `Rola konta ${ user.username }` }
						title={ isSelf ? 'Nie możesz zmienić własnej roli' : undefined }
					/>
				</RowField>

				<RowField label="Status" className="xl:w-40 xl:shrink-0">
					<TagCellSelect
						options={ ACTIVE_OPTIONS }
						value={ user.active ? ACTIVE_ID : INACTIVE_ID }
						onChange={ handleActiveChange }
						disabled={ isSelf }
						ariaLabel={ `Status konta ${ user.username }` }
						title={ isSelf ? 'Nie możesz dezaktywować własnego konta' : undefined }
					/>
				</RowField>

				<RowField label="Dodatkowe uprawnienia" className="min-w-0 xl:flex-1">
					<ExtendedCellSelect
						multiple
						options={ permissionOptions }
						value={ user.additionalPermissions }
						onChange={ (values) => save({ additionalPermissions: values as Permission[] }) }
						disabled={ isSelf }
						placeholder="Brak"
						popoverWidth="22rem"
						maxVisible={ 2 }
						ariaLabel={ `Dodatkowe uprawnienia konta ${ user.username }` }
						title={ isSelf ? 'Nie możesz zmienić własnych uprawnień' : undefined }
					/>
				</RowField>

				<div className="xl:ml-auto xl:shrink-0">
					<UserRowActions user={ user } isSelf={ isSelf }/>
				</div>
			</div>
		</li>
	);
}


/**
 * An inline account flag.
 */
function StatusIcon({ icon: Icon, className, description }: { icon: LucideIcon; className?: string; description: string; }) {
	return (
		<Tooltip content={ description } placement="right" className={ cn('shrink-0 leading-none', className) }>
			<Icon className="size-4" aria-hidden="true"/>
			<span className="sr-only">{ description }</span>
		</Tooltip>
	);
}


/** A label above an inline control. */
function RowField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
	return (
		<div className={ className }>
			<p className="mb-1 text-xs tracking-wide text-os-text-muted uppercase">{ label }</p>
			{ children }
		</div>
	);
}
