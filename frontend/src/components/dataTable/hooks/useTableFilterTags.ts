import type { FilterActiveTag } from '../types/filterTypes';
import { NO_FILTER_TAGS } from './prefsFallbacks';
import { useTablePrefs } from './useTablePrefs';


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

	const setFilterTags = (tags: FilterActiveTag[]) => persist(tags);

	const setFilterTag = (id: string, tag: FilterActiveTag | null) => {
		const without = filterTags.filter((candidate) => candidate.id !== id);

		persist(tag === null ? without : [...without, tag]);
	};

	return { filterTags, setFilterTags, setFilterTag };
}
