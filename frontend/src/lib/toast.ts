import { type Id, toast } from 'react-toastify';

import { type ApiError, SESSION_EXPIRED_MESSAGE } from '@/api/errors';


/** How long a finished progress toast stays up. */
const RESOLVED_AUTOCLOSE_MS = 6_000;


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


/**
 * A toast already on screen, waiting for the thing that opened it to finish.
 */
export interface ProgressToast {
	/** Swaps the spinner's text. */
	step(message: string): void;

	succeed(message: string): void;

	fail(error: ApiError): void;
}


/**
 * A spinner that stays up until the caller resolves it.
 */
export function notifyProgress(message: string): ProgressToast {
	const id = toast.loading(message);

	return {
		step: (next) => toast.update(id, { render: next }),

		succeed: (next) => resolveProgress(id, next, 'success'),

		fail: (error) => {
			if (error.isCanceled) {
				toast.dismiss(id);

				return;
			}

			resolveProgress(id, error.message, 'error');
		},
	};
}


/**
 * Gives the toast back everything `toast.loading` took away, now that there is nothing left to wait for.
 */
function resolveProgress(id: Id, message: string, type: 'success' | 'error'): void {
	toast.update(id, {
		render: message,
		type,
		isLoading: false,
		autoClose: RESOLVED_AUTOCLOSE_MS,
		closeButton: true,
		closeOnClick: true,
		draggable: true,
	});
}
