import type { TagOption, TagRecord } from '@/components/ui/tags';
import { tagOptions } from '@/components/ui/tags';

/* ── Active ──────────────────────────────────────────────────────────────── */

export const ACTIVE_ID = 'active';
export const INACTIVE_ID = 'inactive';

export type ActiveTag = typeof ACTIVE_ID | typeof INACTIVE_ID;

export const ACTIVE_TAGS: TagRecord<ActiveTag> = {
	[ACTIVE_ID]: { id: ACTIVE_ID, name: 'Aktywna', color: 'emerald' },
	[INACTIVE_ID]: { id: INACTIVE_ID, name: 'Nieaktywna', color: 'slate' },
};

export const ACTIVE_TAG_OPTIONS: TagOption[] = tagOptions(ACTIVE_TAGS);


export function toActiveTag(active: boolean): ActiveTag {
	return active ? ACTIVE_ID : INACTIVE_ID;
}
