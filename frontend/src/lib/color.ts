/**
 * Hex color arithmetic, for anywhere one color has to be derived from another.
 *
 * Colors are six hex digits with no leading `#`.
 */

const HEX_PATTERN = /^[0-9A-Fa-f]{6}$/;

/** Whether a value is a whole color rather than a half-typed one. */
export function isCompleteColor(value: string | null | undefined): boolean {
	return typeof value === 'string' && HEX_PATTERN.test(value);
}


/* ── Tints and shades ────────────────────────────────────────────────────── */

/** How many steps a ramp has. Odd, so the color it was built from sits in the middle of it. */
export const COLOR_RAMP_SIZE = 7;

/** How far the outermost tint and shade are mixed toward white and black. */
const MAX_MIX = 0.5;


export function buildColorRamp(color: string, size: number = COLOR_RAMP_SIZE): string[] {
	const channels = toChannels(color);

	if (channels === null) {
		return [];
	}

	const middle = Math.floor(size / 2);

	return Array.from({ length: size }, (_, index) => {
		const distance = index - middle;
		const strength = (Math.abs(distance) / middle) * MAX_MIX;

		return toHexDigits(channels.map((channel) => (distance < 0 ? tint(channel, strength) : shade(channel, strength))));
	});
}

/** One channel mixed toward white. */
function tint(channel: number, strength: number): number {
	return channel + (255 - channel) * strength;
}

/** One channel mixed toward black. */
function shade(channel: number, strength: number): number {
	return channel * (1 - strength);
}


/* ── Readability ─────────────────────────────────────────────────────────── */

/**
 * Whether a color is light enough that what is drawn over it should be dark.
 */
export function isLightColor(color: string): boolean {
	const channels = toChannels(color);

	if (channels === null) {
		return false;
	}

	const [red, green, blue] = channels;

	return (red * 0.299 + green * 0.587 + blue * 0.114) > 150;
}


/* ── Conversion ──────────────────────────────────────────────────────────── */

/** `'EF4444'` → `[239, 68, 68]`, and null for anything that is not a complete color. */
function toChannels(color: string): [number, number, number] | null {
	const digits = color.replace('#', '');

	if (!isCompleteColor(digits)) {
		return null;
	}

	return [
		Number.parseInt(digits.slice(0, 2), 16),
		Number.parseInt(digits.slice(2, 4), 16),
		Number.parseInt(digits.slice(4, 6), 16),
	];
}

/** `[239, 68, 68]` → `'EF4444'`. Fractions are rounded and anything out of range is pulled back in. */
function toHexDigits(channels: number[]): string {
	return channels
		.map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
		.join('')
		.toUpperCase();
}
