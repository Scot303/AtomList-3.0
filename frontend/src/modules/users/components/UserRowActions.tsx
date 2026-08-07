import { Loader2, LogOut, type LucideIcon, MailPlus, Pencil, Unlock } from 'lucide-react';
import { useConfirm } from '@/stores/dialogStore';
import { useModalStore } from '@/stores/modalStore';
import { useForceLogout, useResendVerification, useUnlockUser } from '../hooks/useAdminUserMutations';
import type { AdminUserView } from '../types/types.ts';

interface UserRowActionsProps {
	user: AdminUserView;
	isSelf: boolean;
}

/**
 * What can be done to an account, as opposed to what the account itself may do.
 */
export function UserRowActions({ user, isSelf }: UserRowActionsProps) {
	const openModal = useModalStore((state) => state.openModal);
	const confirm = useConfirm();

	const resend = useResendVerification();
	const unlock = useUnlockUser();
	const forceLogout = useForceLogout();

	const handleEdit = () => {
		void openModal('users.edit', { userId: user.id, username: user.username, email: user.email });
	};

	const handleResend = async () => {
		const confirmed = await confirm({
			title: 'Wysłać link ponownie?',
			message: `Na adres ${ user.email } zostanie wysłany nowy link weryfikacyjny.`,
			confirmText: 'Wyślij',
			variant: 'info',
		});

		if (confirmed) {
			resend.mutate(user.id);
		}
	};

	const handleUnlock = async () => {
		const confirmed = await confirm({
			title: 'Odblokować konto?',
			message: `Blokada konta ${ user.username } zostanie zdjęta natychmiast, bez czekania na jej wygaśnięcie.`,
			confirmText: 'Odblokuj',
			variant: 'warning',
		});

		if (confirmed) {
			unlock.mutate(user.id);
		}
	};

	const handleForceLogout = async () => {
		const confirmed = await confirm({
			title: 'Zakończyć wszystkie sesje?',
			message: `Konto ${ user.username } zostanie wylogowane na wszystkich urządzeniach. Samo konto pozostanie bez zmian i będzie mogło zalogować się ponownie.`,
			confirmText: 'Zakończ sesje',
			variant: 'warning',
		});

		if (confirmed) {
			forceLogout.mutate(user.id);
		}
	};

	return (
		<div className="flex items-center gap-2">
			{ !user.emailVerified && (
				<ActionButton
					icon={ MailPlus }
					label="Wyślij ponownie link weryfikacyjny"
					onClick={ () => void handleResend() }
					isLoading={ resend.isPending }
				/>
			) }

			{ user.locked && (
				<ActionButton
					icon={ Unlock }
					label="Odblokuj konto"
					onClick={ () => void handleUnlock() }
					isLoading={ unlock.isPending }
				/>
			) }

			{ !isSelf && (
				<ActionButton
					icon={ LogOut }
					label="Zakończ wszystkie sesje"
					onClick={ () => void handleForceLogout() }
					isLoading={ forceLogout.isPending }
					disabled={ isSelf }
				/>
			) }

			<ActionButton icon={ Pencil } label="Zmień login i adres e-mail" onClick={ handleEdit }/>
		</div>
	);
}

interface ActionButtonProps {
	icon: LucideIcon;
	/** Serves as both the accessible name and the hover text, since the button is an icon alone. */
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	disabled?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, isLoading, disabled }: ActionButtonProps) {
	return (
		<button
			type="button"
			aria-label={ label }
			title={ label }
			onClick={ onClick }
			disabled={ isLoading || disabled }
			className="rounded-lg p-1.5 text-os-text-muted transition-colors hover:bg-white/5 hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
		>
			{ isLoading
				? <Loader2 size={ 18 } className="animate-spin" aria-hidden/>
				: <Icon size={ 18 } aria-hidden/> }
		</button>
	);
}
