import type { Transition, Variants } from 'framer-motion';


const SETTLE: Transition = { type: 'spring', visualDuration: 0.2, bounce: 0 };

export const ROW_SETTLE_MS = 450;

const FADE_IN: Transition = { duration: 0.3, ease: [0, 0, 0.2, 1] };
const FADE_OUT: Transition = { duration: 0.14, ease: [0.4, 0, 1, 1] };


const HIDDEN = 'hidden';
const SHOWN = 'shown';
const GONE = 'gone';


interface RowMotion {
	layout: 'position';
	initial: string;
	animate: string;
	exit: string;
	variants: Variants;
	transition: Transition;
}


export const ROW_MOTION: RowMotion = {
	layout: 'position',
	initial: HIDDEN,
	animate: SHOWN,
	exit: GONE,
	variants: {
		[HIDDEN]: { opacity: 0 },
		[SHOWN]: { opacity: 1, transition: FADE_IN },
		[GONE]: { opacity: 0, transition: FADE_OUT },
	},
	transition: { layout: SETTLE },
};


export const ROW_CARD_MOTION: { variants: Variants } = {
	variants: {
		[HIDDEN]: { y: -10 },
		[SHOWN]: { y: 0, transition: SETTLE },
		[GONE]: { y: -6, transition: FADE_OUT },
	},
};
