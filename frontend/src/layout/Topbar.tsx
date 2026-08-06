import { Menu as MenuIcon, PanelLeftClose } from 'lucide-react';
import { useLocation } from 'react-router';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MODULES } from '@/modules/registry';
import { useUiStore } from '@/stores/uiStore';
import { UserMenu } from './UserMenu';

export function Topbar() {
	const isDesktop = useIsDesktop();
	const location = useLocation();

	const sidebarOpen = useUiStore((state) => state.sidebarOpen);
	const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
	const toggleSidebar = useUiStore((state) => state.toggleSidebar);
	const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);

	const menuOpen = isDesktop ? sidebarOpen : mobileNavOpen;
	const currentTitle = MODULES.find((module) => location.pathname.startsWith(module.path))?.label ?? 'AtomList';

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

			<h1 className="truncate text-base font-semibold text-os-text">{ currentTitle }</h1>

			<div className="ml-auto flex items-center">
				<UserMenu/>
			</div>
		</header>
	);
}
