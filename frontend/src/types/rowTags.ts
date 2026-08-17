import type { TagOption } from '@/components/ui/tags';

/* ── Active ──────────────────────────────────────────────────────────────── */

export const ACTIVE_ID = 'active';
export const INACTIVE_ID = 'inactive';

export type ActiveTag = typeof ACTIVE_ID | typeof INACTIVE_ID;

export const ACTIVE_TAG_OPTIONS: TagOption[] = [
	{ id: ACTIVE_ID, name: 'Aktywna', color: 'emerald' },
	{ id: INACTIVE_ID, name: 'Nieaktywna', color: 'slate' },
];


export function toActiveTag(active: boolean): ActiveTag {
	return active ? ACTIVE_ID : INACTIVE_ID;
}
