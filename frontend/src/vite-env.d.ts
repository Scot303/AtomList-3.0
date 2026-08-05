/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Origin of the backend API */
	readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
