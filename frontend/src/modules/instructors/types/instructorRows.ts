import type { TagOption, TagRecord } from '@/components/ui/tags';
import { tagOptions } from '@/components/ui/tags';
import { ACTIVE_ID, ACTIVE_TAGS, type ActiveTag, INACTIVE_ID, toActiveTag } from '@/types/rowTags.ts';
import type { ContractType, InstructorView } from './types.ts';


/* ── Kind of contract ────────────────────────────────────────────────────── */

export const CONTRACT_TYPE_TAGS: TagRecord<ContractType> = {
	OPEN: { id: 'OPEN', name: 'OPEN', color: 'blue' },
	TOURNAMENT: { id: 'TOURNAMENT', name: 'TURNIEJOWA', color: 'red' },
};

export const CONTRACT_TYPE_OPTIONS: TagOption[] = tagOptions(CONTRACT_TYPE_TAGS);


export const INSTRUCTOR_ACTIVE_TAGS: TagRecord<ActiveTag> = {
	[ACTIVE_ID]: { ...ACTIVE_TAGS[ACTIVE_ID], name: 'Aktywny' },
	[INACTIVE_ID]: { ...ACTIVE_TAGS[INACTIVE_ID], name: 'Nieaktywny' },
};

export const INSTRUCTOR_ACTIVE_TAG_OPTIONS: TagOption[] = tagOptions(INSTRUCTOR_ACTIVE_TAGS);


/* ── Row ─────────────────────────────────────────────────────────────────── */

export interface InstructorRow {
	id: string;
	name: string;
	lastName: string;
	costPerHour: number;
	contractType: ContractType;
	/** `YYYY-MM-DD`, or `''`. */
	contractSignedDate: string;
	contractNumber: string;
	activeTag: ActiveTag;
	note: string;
	instructor: InstructorView;
}


export function toInstructorRow(instructor: InstructorView): InstructorRow {
	return {
		id: instructor.id,
		name: instructor.name,
		lastName: instructor.lastName,
		costPerHour: instructor.costPerHour,
		contractType: instructor.contractType,
		contractSignedDate: instructor.contractSignedDate ?? '',
		contractNumber: instructor.contractNumber ?? '',
		activeTag: toActiveTag(instructor.active),
		note: instructor.note ?? '',
		instructor,
	};
}
