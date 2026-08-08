/**
 * Coordination between tabs of the same origin.
 *
 * This exists because of one backend rule: presenting a refresh token twice is treated as theft and
 * revokes *every* session the account has (RefreshTokenService#consume). Two tabs waking up at the
 * same moment would each send the same cookie, and the loser would log the user out everywhere. So
 * refreshes are serialized across tabs, not just within one.
 */

/**
 * Runs `task` while holding a lock no other tab of this origin can hold at the same time.
 */
export function withCrossTabLock<T>(name: string, task: () => Promise<T>): Promise<T> {
	const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;

	if (!locks) {
		return task();
	}

	return locks.request(name, () => task());
}

export interface Broadcast<TMessage> {
	post(message: TMessage): void;

	subscribe(listener: (message: TMessage) => void): () => void;
}

/**
 * A one-way message channel between tabs. Messages never leave the origin and are never persisted,
 * so a tab opened later sees nothing that was sent before it existed - which is why callers still
 * need a way to establish their own state on startup.
 */
export function createBroadcast<TMessage>(channelName: string): Broadcast<TMessage> {
	const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(channelName);

	return {
		post(message) {
			channel?.postMessage(message);
		},

		subscribe(listener) {
			if (!channel) {
				return () => undefined;
			}

			const handler = (event: MessageEvent<TMessage>) => listener(event.data);

			channel.addEventListener('message', handler);

			return () => channel.removeEventListener('message', handler);
		},
	};
}
