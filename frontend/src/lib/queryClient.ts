import { QueryCache, QueryClient } from '@tanstack/react-query';
import { type ApiError, ErrorCode, isClientError, toApiError } from '@/api/errors';
import { notifyApiError } from './toast';

const MAX_RETRIES = 2;

declare module '@tanstack/react-query' {
	interface Register {
		/**
		 * Every request the application makes goes through {@link '@/api/axiosInstance'}, whose response
		 * interceptor normalizes on all three of its throw paths - so there is no way for a query or a
		 * mutation to reject with anything but an {@link ApiError}. Declaring it once here is what lets
		 * every call site drop the type argument and still reach `status`, `errorCode` and `is()`.
		 */
		defaultError: ApiError;

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

			// Kept even though `error` is already declared an ApiError. This is the one sink that also sees
			// whatever a `queryFn` body throws on its own - a TypeError over a response that changed shape.
			// Being wrong here would throw from inside an error handler.
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
