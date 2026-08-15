import { Lock, Menu as MenuIcon, PanelLeftClose } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useUiStore } from '@/stores/uiStore';
import { usePageTitle } from './usePageTitle';
import { UserMenu } from './UserMenu';

export function Topbar() {
	const isDesktop = useIsDesktop();
	const title = usePageTitle();

	const sidebarOpen = useUiStore((state) => state.sidebarOpen);
	const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
	const toggleSidebar = useUiStore((state) => state.toggleSidebar);
	const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

	const menuOpen = isDesktop ? sidebarOpen : mobileNavOpen;

	const toggle = () => {
		if (isDesktop) {
			toggleSidebar();
		} else {
			setMobileNavOpen(!mobileNavOpen);
		}
	};

	return (
		<header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-os-border bg-os-surface-dark/85 px-4 shadow-lg backdrop-blur-sm sm:px-6">
			<button
				type="button"
				onClick={ toggle }
				aria-expanded={ menuOpen }
				aria-label={ menuOpen ? 'Ukryj menu' : 'Pokaż menu' }
				className="rounded-xl p-2 text-os-text-muted transition-colors hover:bg-white/5 hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none"
			>
				{ menuOpen ? <PanelLeftClose className="size-5"/> : <MenuIcon className="size-5"/> }
			</button>

			<h1 className="flex min-w-0 items-center gap-1.5 truncate text-base font-semibold text-os-text">
				{ title.text }

				{ title.closed && (
					<>
						<Tooltip content="Lista jest zamknięta - jej dane są już tylko do wglądu" focusable={ false }>
							<Lock size={ 14 } aria-hidden className="shrink-0 text-os-warning"/>
						</Tooltip>
						<span className="sr-only">Lista zamknięta</span>
					</>
				) }
			</h1>

			<div className="ml-auto flex items-center">
				<UserMenu/>
			</div>
		</header>
	);
}
