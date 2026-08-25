// @ts-nocheck
// noinspection JSUnresolvedReference

// Configure WAKE_URL as the full public health URL, for example:
// https://api.example.com/actuator/health
// or
// http://${{"AtomList-3.0 DEV".RAILWAY_PRIVATE_DOMAIN}}:${{"AtomList-3.0 DEV".SERVER_PORT}}/actuator/health

const wakeUrl = Bun.env.WAKE_URL;

if (!wakeUrl) {
	throw new Error("Missing WAKE_URL. Set it to the full /actuator/health URL.");
}

const maxAttempts = Number(Bun.env.WAKE_MAX_ATTEMPTS ?? "6");
const retryDelayMs = Number(Bun.env.WAKE_RETRY_DELAY_MS ?? "15000");

if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
	throw new Error("WAKE_MAX_ATTEMPTS must be a positive integer.");
}

if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
	throw new Error("WAKE_RETRY_DELAY_MS must be zero or a positive number.");
}

let lastError: unknown;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
	try {
		console.log(`Wake attempt ${ attempt }/${ maxAttempts }: ${ wakeUrl }`);

		const response = await fetch(wakeUrl, {
			headers: { "User-Agent": "atomlist-waker/1.0" },
			signal: AbortSignal.timeout(20_000),
		});

		if (!response.ok) {
			throw new Error(`Health endpoint returned HTTP ${ response.status }.`);
		}

		console.log("API is healthy.");
		break;
	} catch (error) {
		lastError = error;
		console.warn(`Wake attempt ${ attempt } failed: ${ String(error) }`);

		if (attempt === maxAttempts) {
			throw new Error(
				`API did not become healthy after ${ maxAttempts } attempts. Last error: ${ String(lastError) }`,
			);
		}

		await Bun.sleep(retryDelayMs);
	}
}
