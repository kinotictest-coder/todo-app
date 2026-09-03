// `type-check` runs plain `tsc` (this repo's toolchain is Bun-only and `vue-tsc`'s
// SFC module resolution does not work under Bun). This shim lets `tsc` resolve
// `*.vue` imports; the Vue template blocks are type-checked by Vite + @vitejs/plugin-vue
// at dev/build time instead. Run `bun run type-check:vue` where Node is available for
// full template checking.
declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const component: DefineComponent<Record<string, any>, Record<string, any>, any>
	export default component
}
