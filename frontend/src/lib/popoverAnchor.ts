/**
 * Marks an element as the box a popover opening inside it should be measured against, in place of the trigger that opened it.
 * A table cell is the case this exists for.
 */
export const POPOVER_ANCHOR_ATTRIBUTE = 'data-popover-anchor';

/** Spread onto whatever element is claiming the job. */
export const popoverAnchorProps = { [POPOVER_ANCHOR_ATTRIBUTE]: '' } as const;

/**
 * The anchor `trigger` sits inside, or the trigger itself where nothing above it claims the job.
 */
export function resolvePopoverAnchor(trigger: Element): Element {
	return trigger.closest(`[${ POPOVER_ANCHOR_ATTRIBUTE }]`) ?? trigger;
}
