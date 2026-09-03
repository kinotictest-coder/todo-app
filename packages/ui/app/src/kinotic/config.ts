import type { ServerInfo } from '@kinotic-ai/core'

const env = import.meta.env

/**
 * Kinotic gateway to connect to. Absent env vars fall back to Kinotic OS Cloud, which
 * is what the platform injects at deploy time; for local `vite dev` set them in
 * `.env.local`.
 */
export const SERVER: ServerInfo = {
	host: env.VITE_KINOTIC_HOST ?? 'api.kinotic.ai',
	port: env.VITE_KINOTIC_PORT ? Number(env.VITE_KINOTIC_PORT) : 443,
	useSSL: (env.VITE_KINOTIC_USE_SSL ?? 'true') === 'true',
}

/** Organization + application this UI authenticates against (this project's own). */
export const ORG_ID = env.VITE_KINOTIC_ORG_ID ?? 'minds'
export const APP_ID = env.VITE_KINOTIC_APP_ID ?? 'todo-app'
