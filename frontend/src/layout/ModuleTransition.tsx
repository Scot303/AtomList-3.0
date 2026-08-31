import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router';
import { MODULES } from '@/modules/registry';


/** How far the incoming module travels before it settles. */
const TRAVEL = 14;

interface Move {
	path: string;
	/** Where the module sits in the sidebar, or `-1` for a screen that is not one. */
	index: number;
	/** `1` for a move down the menu, `-1` for one back up it, `0` for anything else. */
	direction: number;
}


/**
 * Hands one module over to the next: the outgoing one fades, the incoming one arrives from the direction it sits in the sidebar.
 */
export function ModuleTransition() {
	const location = useLocation();

	const outlet = useOutlet();

	const index = MODULES.findIndex((module) => location.pathname.startsWith(module.path));

	const [move, setMove] = useState<Move>({ path: location.pathname, index, direction: 0 });

	if (move.path !== location.pathname) {
		setMove({
			path: location.pathname,
			index,
			direction: move.index === -1 || index === -1 ? 0 : Math.sign(index - move.index),
		});
	}

	return (
		<AnimatePresence mode="wait" initial={ false }>
			<motion.div
				key={ move.path }
				initial={ { opacity: 0, y: move.direction * TRAVEL } }
				animate={ { opacity: 1, y: 0 } }
				exit={ { opacity: 0, transition: { duration: 0.1 } } }
				transition={ { type: 'spring', stiffness: 280, damping: 26 } }
			>
				{ outlet }
			</motion.div>
		</AnimatePresence>
	);
}
