import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { NavLink } from 'react-router';
import logo from '@public/atomlisticon.png';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { groupsQuery } from '@/modules/groups/hooks/useGroups';
import { personsQuery } from '@/modules/persons/hooks/usePersons';
import { MODULES } from '@/modules/registry';
import { useUiStore } from '@/stores/uiStore';


const ACTIVE_MARK_TRANSITION = { type: 'spring', stiffness: 380, damping: 32 } as const;


export function Sidebar() {
	const isDesktop = useIsDesktop();
	const sidebarOpen = useUiStore((state) => state.sidebarOpen);
	const mobileNavOpen = useUiStore((state) => state.mobileNavOpen);
	const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
	const { hasAnyPermission, hasPermission } = useAuth();
	const queryClient = useQueryClient();

	const open = isDesktop ? sidebarOpen : mobileNavOpen;

	useEffect(() => {
		if (isDesktop || !mobileNavOpen) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setMobileNavOpen(false);
			}
		};

		document.addEventListener('keydown', onKeyDown);

		return () => document.removeEventListener('keydown', onKeyDown);
	}, [isDesktop, mobileNavOpen, setMobileNavOpen]);

	/**
	 * Starts a module's list on its way while the pointer is still on the link, so the table has rows by the time it mounts.
	 */
	const prefetchModule = useCallback(
		(moduleId: string) => {
			if (moduleId === 'persons') {
				void queryClient.prefetchQuery({ ...personsQuery(), meta: { silent: true } });
			}

			if ((moduleId === 'groups' || moduleId === 'persons') && hasPermission('READ_GROUPS')) {
				void queryClient.prefetchQuery({ ...groupsQuery(), meta: { silent: true } });
			}
		},
		[queryClient, hasPermission],
	);

	const visibleModules = MODULES.filter((module) => hasAnyPermission(module.permissions));

	return (
		<>
			<AnimatePresence>
				{ !isDesktop && mobileNavOpen ? (
					<motion.div
						initial={ { opacity: 0 } }
						animate={ { opacity: 1 } }
						exit={ { opacity: 0 } }
						transition={ { duration: 0.2 } }
						onClick={ () => setMobileNavOpen(false) }
						className="fixed inset-0 z-40 bg-black/70"
						aria-hidden
					/>
				) : null }
			</AnimatePresence>

			<aside
				inert={ !open || undefined }
				aria-label="Menu główne"
				className={ cn(
					'fixed inset-y-0 left-0 z-50 flex w-72 flex-col',
					'border-r border-os-border bg-os-surface-dark/85 shadow-2xl',
					'transition-transform duration-300 ease-out-soft',
					open ? 'translate-x-0' : '-translate-x-full',
				) }
			>
				<div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-os-border px-5">
					<div className="flex items-center gap-4">
						<img src={ logo } alt="" className="size-8 rounded-lg ring-1 ring-white/10"/>
						<span className="text-lg font-semibold tracking-[0.16em] text-os-text uppercase mt-0.5">
							AtomList
						</span>
					</div>

					<button
						type="button"
						onClick={ () => setMobileNavOpen(false) }
						aria-label="Zamknij menu"
						className="rounded-xl p-1.5 text-os-text-muted transition-colors hover:bg-white/5 hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none lg:hidden"
					>
						<X className="size-4"/>
					</button>
				</div>

				<nav className="flex-1 space-y-1 overflow-y-auto p-3">
					{ visibleModules.map(({ id, label, path, icon: Icon }) => (
						<NavLink
							key={ id }
							to={ path }
							onMouseEnter={ () => prefetchModule(id) }
							onFocus={ () => prefetchModule(id) }
							onClick={ () => setMobileNavOpen(false) }
							className={ ({ isActive }) =>
								cn(
									'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
									'focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none',
									isActive
										? 'text-os-text'
										: 'text-os-text-muted hover:bg-white/5 hover:text-os-text',
								)
							}
						>
							{ ({ isActive }) => (
								<>
									{ isActive ? (
										<>
											<motion.span
												layoutId="sidebar-active-module"
												aria-hidden
												className="absolute inset-0 rounded-xl bg-os-primary/15"
												transition={ ACTIVE_MARK_TRANSITION }
											/>
											<motion.span
												layoutId="sidebar-active-marker"
												aria-hidden
												className="absolute left-0 top-1/2 -mt-2.5 h-5 w-0.5 rounded-full bg-os-primary"
												transition={ ACTIVE_MARK_TRANSITION }
											/>
										</>
									) : null }

									<Icon
										className={ cn(
											'relative size-5 shrink-0',
											isActive && 'text-os-primary',
										) }
									/>
									<span className="relative truncate">{ label }</span>
								</>
							) }
						</NavLink>
					)) }
				</nav>
			</aside>
		</>
	);
}
