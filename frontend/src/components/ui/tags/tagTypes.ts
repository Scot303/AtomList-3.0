export type TagColor =
	| 'red'
	| 'orange'
	| 'amber'
	| 'yellow'
	| 'lime'
	| 'green'
	| 'emerald'
	| 'teal'
	| 'cyan'
	| 'sky'
	| 'blue'
	| 'indigo'
	| 'violet'
	| 'purple'
	| 'fuchsia'
	| 'pink'
	| 'rose'
	| 'slate'
	| 'gray';


export interface TagOption {
	id: string;
	name: string;
	/** A {@link TagColor} name, or any `#rrggbb` value. */
	color: TagColor | string;
	/** Listed, but not selectable. */
	disabled?: boolean;
	/** Muted note shown after the badge. Worth setting whenever `disabled` is, to say why. */
	hint?: string;
}


/**
 * Every member of a closed union, with the badge it shows as.
 */
export type TagRecord<Id extends string> = { [K in Id]: TagOption & { id: K } };


/**
 * The record's badges as a list, for the places that take one - tag columns, selects and filters.
 */
export function tagOptions<Id extends string>(tags: TagRecord<Id>): TagOption[] {
	return Object.values(tags);
}


export const TAG_COLOR_CLASSES: Record<TagColor, string> = {
	red: 'bg-red-500/15 text-red-400',
	orange: 'bg-orange-500/15 text-orange-400',
	amber: 'bg-amber-500/15 text-amber-400',
	yellow: 'bg-yellow-500/15 text-yellow-400',
	lime: 'bg-lime-500/15 text-lime-400',
	green: 'bg-green-500/15 text-green-400',
	emerald: 'bg-emerald-500/15 text-emerald-400',
	teal: 'bg-teal-500/15 text-teal-400',
	cyan: 'bg-cyan-500/15 text-cyan-400',
	sky: 'bg-sky-500/15 text-sky-400',
	blue: 'bg-blue-500/15 text-blue-400',
	indigo: 'bg-indigo-500/15 text-indigo-400',
	violet: 'bg-violet-500/15 text-violet-400',
	purple: 'bg-purple-500/15 text-purple-400',
	fuchsia: 'bg-fuchsia-500/15 text-fuchsia-400',
	pink: 'bg-pink-500/15 text-pink-400',
	rose: 'bg-rose-500/15 text-rose-400',
	slate: 'bg-slate-500/15 text-slate-400',
	gray: 'bg-gray-500/15 text-gray-400',
};

/**
 * The same palette as six hex digits, for the places CSS is written by hand rather than by a class.
 */
export const TAG_COLOR_HEX: Record<TagColor, string> = {
	red: 'EF4444',
	orange: 'F97316',
	amber: 'F59E0B',
	yellow: 'EAB308',
	lime: '84CC16',
	green: '22C55E',
	emerald: '10B981',
	teal: '14B8A6',
	cyan: '06B6D4',
	sky: '0EA5E9',
	blue: '3B82F6',
	indigo: '6366F1',
	violet: '8B5CF6',
	purple: 'A855F7',
	fuchsia: 'D946EF',
	pink: 'EC4899',
	rose: 'F43F5E',
	slate: '64748B',
	gray: '6B7280',
};


export function resolveTagHex(color: TagColor | string): string {
	return color in TAG_COLOR_HEX ? TAG_COLOR_HEX[color as TagColor] : color.replace('#', '');
}


/**
 * A stand-in for an id no option covers.
 */
export function unknownTag(id: string): TagOption {
	return { id, name: '?', color: 'gray' };
}
