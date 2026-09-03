<script setup lang="ts">
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { onMounted } from 'vue'
import { connection, logout } from '../kinotic/connection'
import { useWorkspace } from '../stores/useWorkspace'
import ListSidebar from './ListSidebar.vue'
import TodoPane from './TodoPane.vue'

const { loadAll } = useWorkspace()
const toast = useToast()

onMounted(async () => {
	try {
		await loadAll()
	} catch (e) {
		toast.add({
			severity: 'error',
			summary: 'Failed to load workspace',
			detail: e instanceof Error ? e.message : String(e),
			life: 6000,
		})
	}
})
</script>

<template>
	<div class="shell">
		<header class="shell__topbar">
			<span class="shell__brand"><i class="pi pi-check-square" /> Todo App</span>
			<div style="display: flex; align-items: center; gap: 0.75rem">
				<span style="color: var(--app-text-muted); font-size: 0.9rem">{{ connection.email }}</span>
				<Button
					label="Sign out"
					icon="pi pi-sign-out"
					severity="secondary"
					size="small"
					text
					@click="logout"
				/>
			</div>
		</header>
		<div class="shell__body">
			<ListSidebar />
			<TodoPane />
		</div>
	</div>
</template>
