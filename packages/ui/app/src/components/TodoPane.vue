<script setup lang="ts">
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { computed, ref } from 'vue'
import type { StatusFilter, Todo } from '../kinotic/types'
import { useWorkspace } from '../stores/useWorkspace'
import TodoEditorDialog from './TodoEditorDialog.vue'
import TodoItem from './TodoItem.vue'

const { state, visibleTodos, activeLists, addTodo } = useWorkspace()
const toast = useToast()

const title = computed(() => {
	if (state.activeView === 'all') return 'All'
	if (state.activeView === 'inbox') return 'Inbox'
	return activeLists.value.find((l) => l.id === (state.activeView as { listId: string }).listId)?.name ?? 'List'
})

const quickTitle = ref('')
const editorOpen = ref(false)
const editing = ref<Todo | null>(null)

const statusOptions: { label: string; value: StatusFilter }[] = [
	{ label: 'All', value: 'all' },
	{ label: 'Active', value: 'active' },
	{ label: 'Done', value: 'done' },
]
const labelOptions = computed(() => [
	{ label: 'Any label', value: null as string | null },
	...state.labels.map((l) => ({ label: l.name, value: l.id as string })),
])

async function quickAdd() {
	const t = quickTitle.value.trim()
	if (!t) return
	quickTitle.value = ''
	try {
		await addTodo({ title: t })
	} catch (e) {
		toast.add({ severity: 'error', summary: 'Could not add todo', detail: msg(e), life: 5000 })
	}
}

function openNew() {
	editing.value = null
	editorOpen.value = true
}
function openEdit(todo: Todo) {
	editing.value = todo
	editorOpen.value = true
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))
</script>

<template>
	<section class="pane">
		<div class="pane__header">
			<h1 class="pane__title">{{ title }}</h1>
			<span class="pane__count">{{ visibleTodos.length }}</span>
			<Button
				label="New"
				icon="pi pi-plus"
				size="small"
				style="margin-left: auto"
				@click="openNew"
			/>
		</div>

		<div class="toolbar">
			<InputText
				v-model="quickTitle"
				placeholder="Add a todo and press Enter"
				class="grow"
				style="max-width: 420px"
				@keyup.enter="quickAdd"
			/>
		</div>

		<div class="toolbar">
			<IconField>
				<InputIcon class="pi pi-search" />
				<InputText v-model="state.filter.search" placeholder="Search" size="small" />
			</IconField>
			<Select
				v-model="state.filter.status"
				:options="statusOptions"
				option-label="label"
				option-value="value"
				size="small"
			/>
			<Select
				v-model="state.filter.labelId"
				:options="labelOptions"
				option-label="label"
				option-value="value"
				size="small"
				show-clear
				placeholder="Any label"
			/>
		</div>

		<div v-if="visibleTodos.length" class="todo-list">
			<TodoItem v-for="todo in visibleTodos" :key="todo.id ?? ''" :todo="todo" @edit="openEdit" />
		</div>
		<div v-else-if="state.loading" class="empty">Loading…</div>
		<div v-else class="empty">Nothing here yet.</div>

		<TodoEditorDialog v-model:visible="editorOpen" :todo="editing" />
	</section>
</template>
