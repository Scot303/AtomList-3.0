import { useMutation, useQuery } from '@tanstack/react-query';
import type { LoginResponse } from '@/types/auth';
import { requestLoginCode, resendVerification, verifyEmail, verifyLoginCode } from '../api/authApi';
import { useAuth } from './useAuth';
import { authKeys } from "@/modules/auth/api/authKeys.ts";


export function useRequestLoginCode() {
	return useMutation({
		mutationFn: requestLoginCode,
	});
}


export function useVerifyLoginCode(onVerified?: (response: LoginResponse) => void) {
	const { signIn } = useAuth();

	return useMutation({
		mutationFn: verifyLoginCode,
		onSuccess: (response) => {
			signIn(response);
			onVerified?.(response);
		},
	});
}


export function useResendVerification() {
	return useMutation({
		mutationFn: resendVerification,
	});
}


export function useEmailVerification(token: string) {
	return useQuery({
		queryKey: authKeys.emailVerification(token),
		queryFn: async (): Promise<true> => {
			await verifyEmail(token);

			return true;
		},
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
		refetchOnReconnect: false,
		meta: { silent: true },
	});
}
