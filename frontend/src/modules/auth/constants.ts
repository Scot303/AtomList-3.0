/**
 * Mirrors of the backend's sign-in policy (app.security.login in application.yaml).
 */

/** LOGIN_CODE_LENGTH. */
export const LOGIN_CODE_LENGTH = 16;

/** LoginCodeGenerator groups the code in fours in the email; the input mirrors that grouping. */
export const LOGIN_CODE_GROUP_SIZE = 4;

/** LOGIN_CODE_RESEND_COOLDOWN. Asking again sooner is silently ignored by the backend. */
export const LOGIN_CODE_RESEND_COOLDOWN_SECONDS = 60;

/** EMAIL_VERIFICATION_RESEND_COOLDOWN. */
export const VERIFICATION_RESEND_COOLDOWN_SECONDS = 5 * 60;

/** LOGIN_CODE_TTL, shown so nobody wonders how long they have. */
export const LOGIN_CODE_TTL_MINUTES = 15;

/** Everything a mail client, the clipboard, or a hesitant typist may have added around the code. */
export function normalizeLoginCode(value: string): string {
	return value.replace(/\s+/g, '');
}
