<script setup lang="ts">
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import { computed, reactive, ref, watch } from 'vue'
import type { Priority, Todo } from '../kinotic/types'
import { useWorkspace } from '../stores/useWorkspace'

const props = defineProps<{ visible: boolean; todo: Todo | null }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const { state, activeLists, addTodo, updateTodo } = useWorkspace()
const toast = useToast()

const priorityOptions: { label: string; value: Priority }[] = [
	{ label: 'Low', value: 'low' },
	{ label: 'Normal', value: 'normal' },
	{ label: 'High', value: 'high' },
]
const listOptions = computed(() => [
	{ label: 'Inbox', value: '' },
	...activeLists.value.map((l) => ({ label: l.name, value: l.id as string })),
])
const labelOptions = computed(() => state.labels.map((l) => ({ label: l.name, value: l.id as string })))

const form = reactive({
	title: '',
	description: '',
	priority: 'normal' as Priority,
	listId: '',
	labelIds: [] as string[],
	dueDate: null as Date | null,
})

const isEdit = computed(() => props.todo != null)
const saving = ref(false)

watch(
	() => props.visible,
	(open) => {
		if (!open) return
		const t = props.todo
		form.title = t?.title ?? ''
		form.description = t?.description ?? ''
		form.priority = (t?.priority as Priority) ?? 'normal'
		form.listId = t?.listId ?? currentListId()
		form.labelIds = [...(t?.labelIds ?? [])]
		form.dueDate = t?.dueDate != null ? new Date(t.dueDate) : null
	},
)

function currentListId(): string {
	const v = state.activeView
	return v === 'all' || v === 'inbox' ? '' : v.listId
}

function close() {
	emit('update:visible', false)
}

async function save() {
	if (!form.title.trim()) return
	const payload = {
		title: form.title,
		description: form.description,
		priority: form.priority,
		listId: form.listId,
		labelIds: form.labelIds,
		dueDate: form.dueDate ? form.dueDate.getTime() : null,
	}
	saving.value = true
	try {
		if (props.todo) await updateTodo(props.todo.id as string, payload)
		else await addTodo(payload)
		close()
	} catch (e) {
		toast.add({
			severity: 'error',
			summary: 'Could not save',
			detail: e instanceof Error ? e.message : String(e),
			life: 5000,
		})
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<Dialog
		:visible="visible"
		:header="isEdit ? 'Edit todo' : 'New todo'"
		modal
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<div class="dialog-form">
			<div class="field">
				<label for="t-title">Title</label>
				<InputText id="t-title" v-model="form.title" autofocus @keyup.enter="save" />
			</div>
			<div class="field">
				<label for="t-desc">Description</label>
				<Textarea id="t-desc" v-model="form.description" rows="3" auto-resize />
			</div>
			<div class="field">
				<label>List</label>
				<Select v-model="form.listId" :options="listOptions" option-label="label" option-value="value" />
			</div>
			<div class="field">
				<label>Priority</label>
				<Select
					v-model="form.priority"
					:options="priorityOptions"
					option-label="label"
					option-value="value"
				/>
			</div>
			<div class="field">
				<label>Due date</label>
				<DatePicker v-model="form.dueDate" date-format="M d, yy" show-button-bar show-icon />
			</div>
			<div class="field">
				<label>Labels</label>
				<MultiSelect
					v-model="form.labelIds"
					:options="labelOptions"
					option-label="label"
					option-value="value"
					display="chip"
					placeholder="None"
				/>
			</div>
		</div>
		<template #footer>
			<Button label="Cancel" severity="secondary" text @click="close" />
			<Button label="Save" :loading="saving" :disabled="!form.title.trim()" @click="save" />
		</template>
	</Dialog>
</template>
