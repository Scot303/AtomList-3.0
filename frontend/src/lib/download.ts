/**
 * Handing a binary response the browser fetched over XHR back to the user.
 */

import { toApiError } from '@/api/errors';
import { notifyProgress } from './toast';


/** Long enough for the browser to have started reading the blob before the URL goes away. */
const REVOKE_DELAY_MS = 60_000;

const FILENAME_STAR = /filename\*=\s*(?:UTF-8|utf-8)''([^;]+)/;
const FILENAME_PLAIN = /filename=\s*"?([^";]+)"?/;


/**
 * A binary response together with the name the server asked for it to be saved under.
 */
export interface DownloadedFile {
	blob: Blob;
	fileName: string;
}


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


/**
 * One file the user asked for, with the wording for each stage of getting it.
 */
export interface TrackedDownload {
	fetch: (onTransferStart: () => void) => Promise<DownloadedFile>;

	/** Opens the toast. True from the click until the first byte. */
	pending: string;

	/** Replaces text once bytes arrive. Leave out for a file the server does not have to build first. */
	transferring?: string;

	done: (fileName: string) => string;

	deliver: (file: DownloadedFile) => void;
}


/**
 * Fetches a file under a progress toast and hands it over.
 */
export async function downloadTracked(download: TrackedDownload): Promise<DownloadedFile> {
	const { fetch, pending, transferring, done, deliver } = download;
	const progress = notifyProgress(pending);

	try {
		const file = await fetch(() => {
			if (transferring !== undefined) {
				progress.step(transferring);
			}
		});

		deliver(file);
		progress.succeed(done(file.fileName));

		return file;
	} catch (error) {
		progress.fail(toApiError(error));

		throw error;
	}
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
