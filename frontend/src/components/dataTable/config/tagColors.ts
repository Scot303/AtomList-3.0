import { TAG_COLOR_HEX, type TagColor } from '@/components/ui/tags';


const POOL_COLORS: readonly TagColor[] = [
	'red', 'orange', 'amber', 'yellow', 'lime',
	'green', 'emerald', 'teal', 'cyan', 'sky',
	'blue', 'indigo', 'violet', 'purple', 'fuchsia',
	'pink', 'rose',
];

export const COLOR_POOL: readonly string[] = POOL_COLORS.map((color) => TAG_COLOR_HEX[color]);


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
