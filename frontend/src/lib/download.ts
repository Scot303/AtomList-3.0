/**
 * Handing a binary response the browser fetched over XHR back to the user.
 */

/** Long enough for the browser to have started reading the blob before the URL goes away. */
const REVOKE_DELAY_MS = 60_000;

const FILENAME_STAR = /filename\*=\s*(?:UTF-8|utf-8)''([^;]+)/;
const FILENAME_PLAIN = /filename=\s*"?([^";]+)"?/;


/**
 * Reads the filename a `Content-Disposition` header asked for.
 */
export function fileNameFromDisposition(header: unknown): string | null {
	if (typeof header !== 'string') {
		return null;
	}

	const encoded = FILENAME_STAR.exec(header);

	if (encoded?.[1]) {
		try {
			return decodeURIComponent(encoded[1]);
		} catch {
			// Malformed percent-encoding: fall through to the plain form rather than throwing.
		}
	}

	return FILENAME_PLAIN.exec(header)?.[1] ?? null;
}


/**
 * Opens a blob in a new tab, falling back to a download when the tab is blocked.
 */
export function openBlobInNewTab(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const tab = window.open(url, '_blank', 'noopener,noreferrer');

	if (!tab) {
		triggerDownload(url, fileName);
	}

	window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}


/**
 * Saves a blob to the user's downloads under `fileName`.
 */
export function saveBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);

	triggerDownload(url, fileName);

	window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}


function triggerDownload(url: string, fileName: string): void {
	const anchor = document.createElement('a');

	anchor.href = url;
	anchor.download = fileName;
	anchor.rel = 'noopener';

	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
}
