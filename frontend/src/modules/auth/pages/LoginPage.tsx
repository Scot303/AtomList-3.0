import { useCallback } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { DEFAULT_AUTHENTICATED_PATH, safeInternalPath } from '@/routes/paths'

import { CodeStep } from '../components/CodeStep'
import { AuthLayout } from '../components/AuthLayout'
import { IdentifierStep } from '../components/IdentifierStep'
import { useAuth } from '../hooks/useAuth'
import { useLoginFlowStore } from '../stores/loginFlowStore'

export function LoginPage() {
	const { isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const step = useLoginFlowStore((state) => state.step);
	const identifier = useLoginFlowStore((state) => state.identifier);
	const codeRequestedAt = useLoginFlowStore((state) => state.codeRequestedAt);
	const beginCodeStep = useLoginFlowStore((state) => state.beginCodeStep);
	const markCodeRequested = useLoginFlowStore((state) => state.markCodeRequested);
	const resetFlow = useLoginFlowStore((state) => state.reset);

	const intendedPath = safeInternalPath((location.state as { from?: unknown } | null)?.from) ?? DEFAULT_AUTHENTICATED_PATH;

	const handleSignedIn = useCallback(() => {
		resetFlow();
		navigate(intendedPath, { replace: true });
	}, [intendedPath, navigate, resetFlow]);

	if (isAuthenticated) {
		return <Navigate to={ intendedPath } replace/>;
	}

	if (step === 'code' && identifier.length > 0) {
		return (
			<AuthLayout title="Wpisz kod logowania">
				<CodeStep
					identifier={ identifier }
					codeRequestedAt={ codeRequestedAt }
					onCodeResent={ markCodeRequested }
					onChangeIdentifier={ resetFlow }
					onSignedIn={ handleSignedIn }
				/>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout title="Zaloguj się" subtitle="Podaj swój login, a my wyślemy Ci jednorazowy kod.">
			<IdentifierStep defaultIdentifier={ identifier } onCodeRequested={ beginCodeStep }/>
		</AuthLayout>
	);
}
