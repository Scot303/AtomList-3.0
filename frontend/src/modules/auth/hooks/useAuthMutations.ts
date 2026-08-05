import { useMutation, type UseMutationResult } from '@tanstack/react-query'

import { type ApiError, rethrowAsApiError } from '@/api/errors'
import type { LoginResponse } from '@/types/auth'

import { requestLoginCode, resendVerification, verifyEmail, verifyLoginCode, type VerifyLoginCodeInput, } from '../api/authApi'
import { useAuth } from './useAuth'


export function useRequestLoginCode(): UseMutationResult<void, ApiError, string> {
	return useMutation({
		mutationFn: (identifier: string) => requestLoginCode(identifier).catch(rethrowAsApiError),
	});
}


export function useVerifyLoginCode(onVerified?: (response: LoginResponse) => void,): UseMutationResult<LoginResponse, ApiError, VerifyLoginCodeInput> {
	const { signIn } = useAuth();

	return useMutation({
		mutationFn: (input: VerifyLoginCodeInput) => verifyLoginCode(input).catch(rethrowAsApiError),
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


export function useVerifyEmail(): UseMutationResult<void, ApiError, string> {
	return useMutation({
		mutationFn: (token: string) => verifyEmail(token).catch(rethrowAsApiError),
	});
}
