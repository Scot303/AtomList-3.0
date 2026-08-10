import { useCallback, useMemo } from 'react';
import type { FilterActiveTag } from './types/filterTypes';
import { useTablePrefs } from './useTablePrefs';


/** A stable fallback: a fresh literal per render would re-identify the tags every render. */
const NO_FILTER_TAGS: FilterActiveTag[] = [];

export interface TableFilterTagsBinding {
	filterTags: FilterActiveTag[];
	setFilterTags: (tags: FilterActiveTag[]) => void;
	/** Replaces the tag with this id, adds it when there is none, and removes it when given `null`. */
	setFilterTag: (id: string, tag: FilterActiveTag | null) => void;
}

/**
 * A table's filter tags, for a page that wants to control them from outside the table - a shortcut button
 * that applies a filter the user could also have built by hand.
 */
export function useTableFilterTags(moduleKey: string): TableFilterTagsBinding {
	const { read, bind } = useTablePrefs(moduleKey);

	const filterTags = read('filterTags', NO_FILTER_TAGS);
	const persist = bind('filterTags', filterTags);

	const setFilterTags = useCallback((tags: FilterActiveTag[]) => persist(tags), [persist]);

	const setFilterTag = useCallback(
		(id: string, tag: FilterActiveTag | null) => {
			const without = filterTags.filter((candidate) => candidate.id !== id);

			persist(tag === null ? without : [...without, tag]);
		},
		[filterTags, persist],
	);

	return useMemo(
		() => ({ filterTags, setFilterTags, setFilterTag }),
		[filterTags, setFilterTags, setFilterTag],
	);
}
