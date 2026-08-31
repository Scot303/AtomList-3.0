import type { PersonView } from '@/modules/persons/types/types.ts';


/**
 * What a send would do, worked out before it is made.
 */
export interface SmsRecipientPreview {
	/** Everybody the send would reach for, once each, however many ways they were picked. */
	recipients: PersonView[];
	/** Those with a number of their own or a household one. */
	reachable: PersonView[];
	/** Those with neither, who the send will skip and report back. */
	unreachable: PersonView[];
	/** How many texts that comes to - one per number, so siblings on one household number count once. */
	messageCount: number;
}


const EMPTY: SmsRecipientPreview = { recipients: [], reachable: [], unreachable: [], messageCount: 0 };


/**
 * Resolves the two pickers into the people an SMS would actually go to.
 */
export function buildRecipientPreview(persons: PersonView[], personIds: readonly string[], groupIds: readonly string[],): SmsRecipientPreview {
	if (personIds.length === 0 && groupIds.length === 0) {
		return EMPTY;
	}

	const named = new Set(personIds);
	const fromGroups = new Set(groupIds);

	const recipients = persons.filter((person) =>
		named.has(person.id) || ( person.active && person.groupIds.some((id) => fromGroups.has(id)) ));

	const reachable = recipients.filter((person) => hasPhone(person));
	const unreachable = recipients.filter((person) => !hasPhone(person));

	const numbers = new Set(reachable.map((person) => person.effectivePhone));

	return { recipients, reachable, unreachable, messageCount: numbers.size };
}


function hasPhone(person: PersonView): boolean {
	return person.effectivePhone !== null && person.effectivePhone !== '';
}
