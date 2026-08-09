/**
 * Filter tags carry their own color, so several of them stay tellable apart at a glance.
 *
 * Stored as six hex digits with no leading `#`, because that is what {@link ColorPicker} reads and writes.
 * Use {@link toHexColor} anywhere CSS needs it.
 */
const COLOR_POOL = [
	'EF4444', 'F97316', 'F59E0B', 'EAB308', '84CC16',
	'22C55E', '10B981', '14B8A6', '06B6D4', '0EA5E9',
	'3B82F6', '6366F1', '8B5CF6', 'A855F7', 'D946EF',
	'EC4899', 'F43F5E',
] as const;

export function getRandomTagColor(): string {
	return COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
}

/** `'EF4444'` → `'#EF4444'`. Tolerates a value that already has the hash. */
export function toHexColor(color: string): string {
	return color.startsWith('#') ? color : `#${ color }`;
}

/**
 * The same color at a given opacity, as an 8-digit hex.
 * `alpha` is 0-255, written as the two hex digits CSS appends to `#rrggbb`.
 */
export function withAlpha(color: string, alpha: string): string {
	return `${ toHexColor(color) }${ alpha }`;
}
