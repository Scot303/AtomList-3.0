/**
 * The one place the app's name appears in any browser-wide name: storage keys, lock names, broadcast channels.
 * All three share an origin with every other script on it, so all three need the prefix.
 */
const APP_NAMESPACE = 'atomlist';

/**
 * Prefixes any browser-wide identifier that is not a storage key: a Web Locks name, a BroadcastChannel name.
 */
export function namespaced(name: string): string {
	return `${ APP_NAMESPACE }.${ name }`;
}

/**
 * Builds a namespaced storage key.
 */
export function storageKey(name: string): string {
	return namespaced(name);
}
