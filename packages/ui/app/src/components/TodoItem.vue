<script setup lang="ts">
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Chip from 'primevue/chip'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed } from 'vue'
import type { Todo } from '../kinotic/types'
import { useWorkspace } from '../stores/useWorkspace'

const props = defineProps<{ todo: Todo }>()
const emit = defineEmits<{ edit: [todo: Todo] }>()

const { labelsById, toggleTodo, deleteTodo } = useWorkspace()
const confirm = useConfirm()
const toast = useToast()

const done = computed(() => props.todo.completed)
const checked = computed({
	get: () => props.todo.completed,
	set: () => void run(toggleTodo(props.todo.id as string)),
})

const prioritySeverity = computed(() =>
	props.todo.priority === 'high' ? 'danger' : props.todo.priority === 'low' ? 'secondary' : 'info',
)

const due = computed(() => {
	if (props.todo.dueDate == null) return null
	const d = new Date(props.todo.dueDate)
	const overdue = !props.todo.completed && props.todo.dueDate < Date.now()
	return {
		text: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
		severity: overdue ? ('danger' as const) : ('secondary' as const),
	}
})

const chips = computed(() =>
	props.todo.labelIds.map((id) => labelsById.value.get(id)).filter((l): l is NonNullable<typeof l> => !!l),
)

function confirmDelete() {
	confirm.require({
		message: `Delete "${props.todo.title}"?`,
		header: 'Delete todo',
		icon: 'pi pi-trash',
		rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
		acceptProps: { label: 'Delete', severity: 'danger' },
		accept: () => run(deleteTodo(props.todo.id as string)),
	})
}

async function run(p: Promise<unknown>) {
	try {
		await p
	} catch (e) {
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: e instanceof Error ? e.message : String(e),
			life: 5000,
		})
	}
}
</script>

<template>
	<div class="todo-item">
		<Checkbox v-model="checked" :binary="true" />
		<div class="todo-item__main">
			<div class="todo-item__title" :class="{ 'todo-item__title--done': done }">{{ todo.title }}</div>
			<div v-if="todo.description" class="todo-item__desc">{{ todo.description }}</div>
			<div class="todo-item__meta">
				<Tag v-if="due" :value="due.text" :severity="due.severity" icon="pi pi-calendar" />
				<Tag
					v-if="todo.priority !== 'normal'"
					:value="todo.priority"
					:severity="prioritySeverity"
				/>
				<Chip
					v-for="label in chips"
					:key="label.id ?? ''"
					:label="label.name"
					:style="{
						background: label.color,
						color: '#fff',
					}"
				/>
			</div>
		</div>
		<div class="todo-item__actions">
			<Button
				icon="pi pi-pencil"
				text
				rounded
				size="small"
				severity="secondary"
				aria-label="Edit"
				@click="emit('edit', todo)"
			/>
			<Button
				icon="pi pi-trash"
				text
				rounded
				size="small"
				severity="secondary"
				aria-label="Delete"
				@click="confirmDelete"
			/>
		</div>
	</div>
</template>
