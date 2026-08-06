import { useEffect, useState } from 'react';

/**
 * Whole seconds left until `deadline` (epoch ms), ticking down to zero and stopping there.
 */
export function useCountdown(deadline: number | null): number {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		if (deadline === null || deadline <= Date.now()) {
			return;
		}

		const interval = setInterval(() => {
			setNow(Date.now());

			if (Date.now() >= deadline) {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [deadline]);

	if (deadline === null) {
		return 0;
	}

	return Math.max(0, Math.ceil((deadline - now) / 1000));
}
