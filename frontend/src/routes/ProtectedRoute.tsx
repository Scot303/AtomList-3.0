import { useState } from 'react';
import { ServerCrash, ShieldCheck } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { Button } from '@/components/ui/buttons/Button.tsx';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import type { Permission } from '@/types/auth';

import { paths } from './paths';

/**
 * Gate in front of everything that needs a session.
 */
export function ProtectedRoute() {
	const { status } = useAuth();
	const location = useLocation();

	// Still working out whether the refresh cookie yields a session.
	if (status === 'initializing') {
		return <FullPageLoader/>;
	}

	// The session is fine as far as anyone knows; the user behind it just could not be read.
	if (status === 'unavailable') {
		return <SessionUnavailable/>;
	}

	if (status === 'unauthenticated') {
		return (
			<Navigate
				to={ paths.login }
				replace
				state={ { from: `${ location.pathname }${ location.search }` } }
			/>
		);
	}

	return <Outlet/>;
}

/**
 * The dead end for a session that could not be verified.
 * Offers the two ways out: try again, or give up and sign in from scratch.
 */
function SessionUnavailable() {
	const { reloadUser, signOut } = useAuth();
	const [retrying, setRetrying] = useState(false);

	const retry = () => {
		setRetrying(true);

		// A second failure just leaves this screen up, which already says what went wrong.
		void reloadUser()
			.catch(() => undefined)
			.finally(() => setRetrying(false));
	};

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center px-6">
			<div className="flex max-w-xl flex-col items-center gap-4 px-6 py-14 text-center">
				<ServerCrash className="size-10"/>
				<div>
					<h2 className="text-xl font-bold text-os-text">Nie udało się wczytać konta</h2>
					<p className="mt-3 text-base text-os-text">
						Twoja sesja jest najprawdopodobniej nadal aktywna - to serwer nie odpowiedział poprawnie. Spróbuj ponownie za chwilę.
					</p>
				</div>

				<div className="mt-2 flex flex-wrap items-center justify-center gap-5">
					<Button className="w-45" onClick={ retry } isLoading={ retrying }>
						Spróbuj ponownie
					</Button>

					<Button className="w-45" variant="secondary" onClick={ () => void signOut() }>
						Wyloguj się
					</Button>
				</div>
			</div>
		</div>
	);
}

/** Wraps a single route whose module needs a specific permission. */
export function RequirePermission({ permissions, children, }: { permissions: readonly Permission[]; children: React.ReactNode }) {
	const { hasAnyPermission } = useAuth();

	if (hasAnyPermission(permissions)) {
		return children;
	}

	return (
		<div className="mx-auto flex min-h-screen max-w-xl items-center justify-center">
			<div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
				<ShieldCheck className="size-10"/>
				<div>
					<h2 className="text-xl font-bold text-os-text">Brak uprawnień</h2>
					<p className="mt-3 text-base text-os-text">
						Twoje konto nie ma dostępu do tej części aplikacji. Jeśli powinno go mieć, poproś administratora o nadanie uprawnień.
					</p>
				</div>
			</div>
		</div>
	);
}
