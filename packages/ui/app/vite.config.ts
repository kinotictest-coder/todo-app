import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			// Resolve the workspace domain package to its TypeScript source so the
			// browser build and vue-tsc agree (the package's own exports map points
			// non-"development" consumers at a dist/ that is only built during a
			// platform deploy).
			'@todo-app/domain': fileURLToPath(new URL('../../domain/index.ts', import.meta.url)),
		},
	},
	server: {
		port: 5173,
	},
})
