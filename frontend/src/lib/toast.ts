import { toast } from 'react-toastify'

import { type ApiError, SESSION_EXPIRED_MESSAGE } from '@/api/errors'

/**
 * Collapses identical failures into one toast.
 * When the connection drops, every query in flight fails at once with the same message.
 */
function idFor(error: ApiError): string {
	return error.errorCode ?? `${ error.status ?? 'none' }:${ error.message }`;
}

export function notifyApiError(error: ApiError): void {
	toast.error(error.message, { toastId: idFor(error) });
}

export function notifySessionExpired(): void {
	toast.warning(SESSION_EXPIRED_MESSAGE, { toastId: 'session-expired' });
}

export function notifyError(message: string): void {
	toast.error(message, { toastId: message });
}

export function notifySuccess(message: string): void {
	toast.success(message);
}
