import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_ORIGIN_PLACEHOLDER = '__API_ORIGIN__'

/**
 * Substitutes the API origin into the CSP of the `_headers` file Cloudflare Pages reads.
 * Build only: the dev server does not serve `_headers`, so the placeholder is never observable.
 */
function apiOriginCsp(apiBaseUrl: string): Plugin {
	let connectSrc = 'https:'
	if (apiBaseUrl) {
		try {
			connectSrc = new URL(apiBaseUrl).origin
		} catch {
			throw new Error(`VITE_API_BASE_URL is not a valid URL: "${ apiBaseUrl }"`)
		}
	}

	let headersFile = ''

	return {
		name: 'atomlist:api-origin-csp',
		apply: 'build',
		configResolved(config) {
			headersFile = resolve(config.root, config.build.outDir, '_headers')
		},
		writeBundle() {
			let contents: string
			try {
				contents = readFileSync(headersFile, 'utf8')
			} catch {
				// public/_headers is gone, so the bundle would deploy with no security headers at all.
				throw new Error(
					`${ headersFile } was not written. It comes from public/_headers - restore that file, ` +
					'or the deployment ships without CSP, clickjacking or MIME-sniffing protection.',
				)
			}

			if (!contents.includes(API_ORIGIN_PLACEHOLDER)) {
				this.warn(
					`public/_headers no longer contains ${ API_ORIGIN_PLACEHOLDER }; its connect-src is ` +
					'whatever is written there and no longer follows VITE_API_BASE_URL.',
				)
				return
			}

			writeFileSync(headersFile, contents.replaceAll(API_ORIGIN_PLACEHOLDER, connectSrc))
		},
	}
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), 'VITE_')

	if (mode === 'production' && !env.VITE_API_BASE_URL) {
		throw new Error(
			'VITE_API_BASE_URL is not set.\n' +
			'Set it in the Cloudflare Pages project under Settings > Variables and Secrets, as the ' +
			'full origin of the backend and nothing more, e.g. https://api-dev.atomlist.pl\n' +
			'The same origin also has to appear in the backend\'s CORS_ALLOWED_ORIGIN_PATTERNS.',
		)
	}

	return {
		plugins: [react(), tailwindcss(), apiOriginCsp(env.VITE_API_BASE_URL)],
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
			},
		},
		server: {
			port: 5173,
			strictPort: true,
		},
	}
})
