import { useIsDesktop } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/stores/uiStore';
import { ModuleTransition } from './ModuleTransition';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

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
					<ModuleTransition/>
				</main>
			</div>
		</div>
	);
}
