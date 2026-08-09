import { createContext, useContext } from 'react';
import type { DetectOverflowOptions } from '@floating-ui/react';

/**
 * The box a popover belongs to: where its trigger stops counting as visible, and where the panel
 * hanging off that trigger has to stay.
 *
 * A panel is portalled to the body and drawn at the top of the stacking order, which means nothing in
 * the container the trigger scrolled out of can paint over it - a table's sticky header included. So
 * the container has to say what it considers in-bounds, and both halves of the answer come from the
 * same two values: `boundary` names the element whose edges matter, `padding` insets those edges by
 * whatever floats over them.
 *
 * A function rather than a value, because both halves are DOM reads. Evaluated inside floating-ui's
 * positioning pass, which is neither render nor an effect, so a provider needs no `ResizeObserver`,
 * no state round-trip, and no ref read during render. It also means the measurement is re-taken on
 * every reposition, so chrome that changes height needs no invalidating.
 */
export type PopoverClip = () => Pick<DetectOverflowOptions, 'boundary' | 'padding'>;

/**
 * What a popover with no container to answer to gets: floating-ui's own default of the trigger's
 * clipping ancestors, with nothing inset.
 */
const NO_CLIP: PopoverClip = () => ({});

export const PopoverClipContext = createContext<PopoverClip>(NO_CLIP);

/** The clip in force where this popover sits. Safe to call with no provider above it. */
export function usePopoverClip(): PopoverClip {
	return useContext(PopoverClipContext);
}
