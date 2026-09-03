import { BasicCredentialsResolver, Kinotic } from '@kinotic-ai/core'
import { PersistencePlugin } from '@kinotic-ai/persistence'
import { reactive } from 'vue'
import { APP_ID, ORG_ID, SERVER } from './config'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface ConnectionState {
	status: ConnectionStatus
	error: string | null
	email: string | null
}

export const connection = reactive<ConnectionState>({
	status: 'disconnected',
	error: null,
	email: null,
})

let pluginInstalled = false

/**
 * Authenticate as an application user (created in the portal → Members) and open the
 * single WebSocket connection every repository call rides on.
 */
export async function login(email: string, password: string): Promise<void> {
	connection.status = 'connecting'
	connection.error = null
	try {
		if (!pluginInstalled) {
			Kinotic.use(PersistencePlugin)
			pluginInstalled = true
		}
		await Kinotic.connect({
			server: SERVER,
			credentials: new BasicCredentialsResolver(email, password, ORG_ID, APP_ID),
		})
		connection.status = 'connected'
		connection.email = email
	} catch (e) {
		connection.status = 'error'
		connection.error = e instanceof Error ? e.message : String(e)
		throw e
	}
}

export async function logout(): Promise<void> {
	try {
		await Kinotic.disconnect()
	} finally {
		connection.status = 'disconnected'
		connection.email = null
		connection.error = null
	}
}
