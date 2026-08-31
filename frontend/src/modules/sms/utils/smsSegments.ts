/**
 * How many chargeable parts a message costs, mirroring the backend's `SmsSegments`.
 *
 * Kept here as well so the composer can price a message as it is typed, rather than only once it has been sent.
 */

/** Characters the GSM 03.38 alphabet holds, so a message made only of these is sent 7 bits at a time. */
const GSM_ALPHABET = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?'
	+ '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

/** These take two of the 160 slots each, being an escape plus the character itself. */
const GSM_EXTENDED = '^{}\\[~]|€';

const GSM_SINGLE = 160;
const GSM_CONCATENATED = 153;
const UNICODE_SINGLE = 70;
const UNICODE_CONCATENATED = 67;


/**
 * Whether every character survives the 7-bit alphabet, which is what keeps a text at 160 characters a part rather than 70. One Polish diacritic is enough to lose it.
 */
export function isGsmEncodable(message: string): boolean {
	return [...message].every((character) => GSM_ALPHABET.includes(character) || GSM_EXTENDED.includes(character));
}


/**
 * @returns how many parts the message is sent as, and so how many the studio pays for. Zero for nothing to send.
 */
export function countSegments(message: string): number {
	if (message === '') {
		return 0;
	}

	const unicode = !isGsmEncodable(message);
	const length = unicode ? message.length : gsmLength(message);

	if (length <= ( unicode ? UNICODE_SINGLE : GSM_SINGLE )) {
		return 1;
	}

	const perPart = unicode ? UNICODE_CONCATENATED : GSM_CONCATENATED;

	return Math.ceil(length / perPart);
}


/**
 * The message's length in 7-bit slots, where the handful of extended characters take two apiece.
 */
function gsmLength(message: string): number {
	return [...message].reduce((total, character) => total + ( GSM_EXTENDED.includes(character) ? 2 : 1 ), 0);
}
