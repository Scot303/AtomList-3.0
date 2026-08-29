import type { TagOption } from '@/components/ui/tags';
import { ACTIVE_TAG_OPTIONS, type ActiveTag, toActiveTag } from '@/types/rowTags.ts';
import type { ContractType, InstructorView } from './types.ts';


/* ── Kind of contract ────────────────────────────────────────────────────── */

export const CONTRACT_TYPE_OPTIONS: TagOption[] = [
	{ id: 'OPEN', name: 'OPEN', color: 'blue' },
	{ id: 'TOURNAMENT', name: 'TURNIEJOWA', color: 'red' },
];


export const INSTRUCTOR_ACTIVE_TAG_OPTIONS: TagOption[] = ACTIVE_TAG_OPTIONS.map((option) => ( {
	...option,
	name: option.id === 'active' ? 'Aktywny' : 'Nieaktywny',
} ));


export function contractTypeName(contractType: ContractType): string {
	return CONTRACT_TYPE_OPTIONS.find((option) => option.id === contractType)?.name ?? contractType;
}


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
