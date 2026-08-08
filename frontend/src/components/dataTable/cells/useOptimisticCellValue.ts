import { useState } from 'react';

/**
 * Shows an edited value immediately while the mutation behind it is still in flight.
 *
 * The override is dropped as soon as the incoming value changes at all, rather than only when it matches what was sent.
 * A rejected edit therefore snaps back to the truth instead of leaving the cell displaying a value the server never accepted.
 */
export function useOptimisticCellValue<V>(value: V, isSame: (a: V, b: V) => boolean = Object.is) {
	const [override, setOverride] = useState<{ value: V } | null>(null);
	const [baseline, setBaseline] = useState<V>(value);

	if (!isSame(baseline, value)) {
		// The source of truth moved. Whatever we were showing optimistically is now history.
		setBaseline(value);

		if (override !== null) {
			setOverride(null);
		}
	}

	return {
		/** What the cell should render right now. */
		value: override?.value ?? value,
		/** Records the value being sent, so the cell can show it before the round trip finishes. */
		setOptimistic: (next: V) => setOverride({ value: next }),
		isPending: override !== null,
	};
}

/** Comparator for the id arrays a multi-tag column holds, where identity never matches. */
export function sameIdList(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length && a.every((id, index) => id === b[index]);
}
