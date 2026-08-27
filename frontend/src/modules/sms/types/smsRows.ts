import type { TagOption } from '@/components/ui/tags';
import type { SkipReason, SmsView } from './types.ts';


/* ── Who the number belonged to ──────────────────────────────────────────── */

export const RECIPIENT_PERSON_ID = 'PERSON';
export const RECIPIENT_FAMILY_ID = 'FAMILY';

export type RecipientKind = typeof RECIPIENT_PERSON_ID | typeof RECIPIENT_FAMILY_ID;

export const RECIPIENT_KIND_OPTIONS: TagOption[] = [
	{ id: RECIPIENT_PERSON_ID, name: 'Osoba', color: 'blue' },
	{ id: RECIPIENT_FAMILY_ID, name: 'Rodzina', color: 'violet' },
];


export function toRecipientKind(sms: SmsView): RecipientKind {
	return sms.familyId === null ? RECIPIENT_PERSON_ID : RECIPIENT_FAMILY_ID;
}


/* ── Why somebody was left out of SMS ────────────────────────────────────── */

export const SKIP_REASON_NAMES: Record<SkipReason, string> = {
	NO_PHONE: 'brak numeru telefonu',
	NOT_WHITELISTED: 'numer spoza whitelisty',
};


/* ── Row ─────────────────────────────────────────────────────────────────── */

export interface SmsRow {
	id: string;
	/** ISO-8601 timestamp, so the column sorts and filters on the real instant. */
	createdAt: string;
	/** Who it went to, in words. */
	recipientName: string;
	recipientKind: RecipientKind;
	/** Nine digits, as stored. Shown grouped. */
	sentToPhone: string;
	message: string;
	/** How many characters were sent - what the length limit is spent on. */
	length: number;
	/** How many chargeable parts that came to. */
	segments: number;
	sms: SmsView;
}


export function toSmsRow(sms: SmsView): SmsRow {
	return {
		id: sms.id,
		createdAt: sms.createdAt,
		recipientName: sms.recipientName ?? '',
		recipientKind: toRecipientKind(sms),
		sentToPhone: sms.sentToPhone,
		message: sms.message,
		length: sms.message.length,
		segments: sms.segments,
		sms,
	};
}
