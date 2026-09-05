import { useAuth } from '@/modules/auth/hooks/useAuth';
import { MODULES } from '@/modules/registry';

import { LANDING_PATHS } from './paths';


/**
 * The screen a signed-in user should land on: the first of LANDING_PATHS their account can open.
 */
export function useLandingPath(): string {
	const { hasAnyPermission } = useAuth();

	const reachable = LANDING_PATHS.find((path) => {
		const module = MODULES.find((candidate) => candidate.path === path);

		return module !== undefined && hasAnyPermission(module.permissions);
	});

	return reachable ?? LANDING_PATHS[0];
}
