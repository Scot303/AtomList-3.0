/**
 * Mirrors of the SMS payloads the backend sends and takes.
 */

/** Mirror of the backend's `SmsView`. */
export interface SmsView {
	id: string;
	message: string;
	/** Set when the number reached exactly one person. Null on a message to a shared family number. */
	personId: string | null;
	/** Set when the number is shared by a household. Null on a message to one person. */
	familyId: string | null;
	/** Who it went to, in words. */
	recipientName: string | null;
	sentToPhone: string;
	/** How many chargeable parts it was sent as. */
	segments: number;
	/** ISO-8601 timestamp. */
	createdAt: string;
}


/** Mirror of `SkippedRecipientView.SkipReason`. */
export type SkipReason = 'NO_PHONE' | 'NOT_WHITELISTED';


/** Mirror of the backend's `SkippedRecipientView`. */
export interface SkippedRecipientView {
	personId: string;
	fullName: string;
	reason: SkipReason;
}


/**
 * Mirror of the backend's `SmsSendResultView`.
 */
export interface SmsSendResultView {
	sent: SmsView[];
	skipped: SkippedRecipientView[];
}


/**
 * Mirror of the backend's `SendSmsRequest`.
 */
export interface SendSmsPayload {
	message: string;
	personIds: string[];
	groupIds: string[];
}
