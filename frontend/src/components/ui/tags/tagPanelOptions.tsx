import type React from 'react';
import type { SelectOption } from '@/components/ui/select';
import { TagBadge } from './TagBadge';
import type { TagOption } from './tagTypes';

interface TagPanelOptions {
	options: SelectOption[];
	/** Draws each option as its badge rather than as plain text. */
	renderOption: (option: SelectOption) => React.ReactNode;
}

/**
 * Adapts tags for {@link '@/components/ui/select'.SelectPanel}, which knows nothing about color.
 * Shared by the field and inline variants, so both draw their options identically.
 */
export function buildTagPanelOptions(tags: TagOption[]): TagPanelOptions {
	const colorById = new Map(tags.map((tag) => [tag.id, tag.color]));

	return {
		options: tags.map(({ id, name, disabled, hint }) => ({ id, name, disabled, hint })),
		renderOption: (option) => (
			<span className="flex min-w-0 flex-1 overflow-hidden">
				<TagBadge label={ option.name } color={ colorById.get(option.id) ?? 'gray' }/>
			</span>
		),
	};
}
