import { QueryCache, QueryClient } from '@tanstack/react-query';
import { type ApiError, ErrorCode, isClientError, toApiError } from '@/api/errors';
import { notifyApiError } from './toast';

const MAX_RETRIES = 2;

declare module '@tanstack/react-query' {
	interface Register {
		queryMeta: {
			/** Opts a query out of the automatic toast, for one that reports its failure itself. */
			silent?: boolean;
		};
	}
}

/**
 * Failures a query must not toast, because something else has already dealt with them.
 */
function isAlreadyHandled(error: ApiError): boolean {
	if (error.isCanceled) {
		return true;
	}

	if (error.status === 401) {
		return true;
	}

	return error.is(ErrorCode.accountInactive) || error.is(ErrorCode.invalidRefreshToken);
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (query.meta?.silent === true) {
				return;
			}

			const apiError = toApiError(error);

			if (!isAlreadyHandled(apiError)) {
				notifyApiError(apiError);
			}
		},
	}),

	defaultOptions: {
		queries: {
			staleTime: 30_000,
			gcTime: 5 * 60_000,
			retry: (failureCount, error) => failureCount < MAX_RETRIES && !isClientError(toApiError(error)),
			refetchOnWindowFocus: false,
			refetchOnReconnect: true,
		},
		mutations: {
			retry: false,
		},
	},
});
