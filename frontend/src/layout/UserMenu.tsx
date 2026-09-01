import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown, LogOut, MonitorSmartphone } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useConfirm } from '@/stores/dialogStore';


export function UserMenu() {
	const { user, signOut, signOutEverywhere } = useAuth();
	const confirm = useConfirm();

	if (user === null) {
		return null;
	}

	const askToSignOutEverywhere = () => {
		void confirm({
			title: 'Wylogować ze wszystkich urządzeń?',
			message: 'Każda aktywna sesja tego konta zostanie zakończona.',
			confirmText: 'Wyloguj',
			variant: 'danger',
			onConfirm: () => signOutEverywhere().catch(() => undefined),
		});
	};

	return (
		<Menu as="div" className="relative">
			<MenuButton
				className="flex items-center gap-2.5 rounded-xl py-1.5 pr-2 pl-2 transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none">
				<span className="grid size-7 shrink-0 place-items-center rounded-full bg-os-primary/20 text-xs font-semibold text-os-primary ring-1 ring-os-primary/30">
					{ user.username.slice(0, 2).toUpperCase() }
				</span>

				<span className="hidden text-left sm:block">
					<span className="block text-sm leading-tight font-medium text-os-text">{ user.username }</span>
				</span>

				<ChevronDown className="size-4 text-os-text-muted"/>
			</MenuButton>

			<MenuItems
				transition
				anchor={ { to: 'bottom end', gap: 8 } }
				className={ cn('popover-surface z-1400 w-73 p-1.5 focus:outline-none', 'transition duration-150 ease-out-soft data-closed:scale-95 data-closed:opacity-0') }
			>
				<div className="border-b border-os-border px-3 py-3">
					<p className="truncate text-sm font-medium text-os-text">{ user.username }</p>
					<p className="truncate text-sm text-os-text-muted">{ user.email }</p>
				</div>

				<MenuItem>
					<button
						type="button"
						onClick={ () => void signOut() }
						className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-os-text-muted transition-colors data-focus:bg-white/5 data-focus:text-os-text"
					>
						<LogOut className="size-4"/>
						Wyloguj się
					</button>
				</MenuItem>

				<MenuItem>
					<button
						type="button"
						onClick={ askToSignOutEverywhere }
						className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-os-text-muted transition-colors data-focus:bg-white/5 data-focus:text-os-text"
					>
						<MonitorSmartphone className="size-4"/>
						Wyloguj ze wszystkich urządzeń
					</button>
				</MenuItem>
			</MenuItems>
		</Menu>
	);
}
