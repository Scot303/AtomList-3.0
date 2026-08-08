import { Outlet } from 'react-router';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * The frame every signed-in screen renders inside: the sidebar on the left, the bar across the top,
 * and whichever module the route resolved to in the middle.
 */
export function Dashboard() {
	const isDesktop = useIsDesktop();
	const sidebarOpen = useUiStore((state) => state.sidebarOpen);

	return (
		<div className="min-h-dvh">
			<Sidebar/>

			<div
				className={ cn(
					'flex min-h-dvh flex-col transition-[padding-left] duration-300 ease-out-soft',
					isDesktop && sidebarOpen ? 'pl-72' : 'pl-0',
				) }
			>
				<Topbar/>

				<main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
					<Outlet/>
				</main>
			</div>
		</div>
	);
}
