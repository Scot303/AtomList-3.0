import { useMutation, type UseMutationResult, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { type ApiError, rethrowAsApiError } from '@/api/errors';
import type { LoginResponse } from '@/types/auth';
import { requestLoginCode, resendVerification, verifyEmail, verifyLoginCode, type VerifyLoginCodeInput, } from '../api/authApi';
import { useAuth } from './useAuth';
import { authKeys } from "@/modules/auth/api/authKeys.ts";


export function useRequestLoginCode(): UseMutationResult<void, ApiError, string> {
	return useMutation({
		mutationFn: (identifier: string) => requestLoginCode(identifier).catch(rethrowAsApiError),
	});
}


export function useVerifyLoginCode(onVerified?: (response: LoginResponse) => void): UseMutationResult<LoginResponse, ApiError, VerifyLoginCodeInput> {
	const { signIn } = useAuth();

	return useMutation({
		mutationFn: (input: VerifyLoginCodeInput) =>
			verifyLoginCode(input).catch(rethrowAsApiError),
		onSuccess: (response) => {
			signIn(response);
			onVerified?.(response);
		},
	});
}


export function useResendVerification(): UseMutationResult<void, ApiError, string> {
	return useMutation({
		mutationFn: (identifier: string) => resendVerification(identifier).catch(rethrowAsApiError),
	});
}


export function useEmailVerification(token: string): UseQueryResult<true, ApiError> {
	return useQuery<true, ApiError>({
		queryKey: authKeys.emailVerification(token),
		queryFn: async (): Promise<true> => {
			await verifyEmail(token).catch(rethrowAsApiError);

			return true;
		},
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
		refetchOnReconnect: false,
		meta: { silent: true },
	});
}
