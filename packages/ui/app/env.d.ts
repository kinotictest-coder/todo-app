/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Kinotic gateway host. The platform injects this at deploy time. */
	readonly VITE_KINOTIC_HOST?: string
	/** Kinotic gateway port. */
	readonly VITE_KINOTIC_PORT?: string
	/** 'true' to connect over TLS (wss/https). */
	readonly VITE_KINOTIC_USE_SSL?: string
	/** Overrides the organization id the connection authenticates against. */
	readonly VITE_KINOTIC_ORG_ID?: string
	/** Overrides the application id the connection authenticates against. */
	readonly VITE_KINOTIC_APP_ID?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
