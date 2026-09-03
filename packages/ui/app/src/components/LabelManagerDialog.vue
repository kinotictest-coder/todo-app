<script setup lang="ts">
import Button from 'primevue/button'
import ColorPicker from 'primevue/colorpicker'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { useWorkspace } from '../stores/useWorkspace'

defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const { state, addLabel, updateLabel, deleteLabel } = useWorkspace()
const confirm = useConfirm()
const toast = useToast()

const newName = ref('')
const newColor = ref('f59e0b')

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

const hex = (c: string) => (c.startsWith('#') ? c : `#${c}`)

async function create() {
	const name = newName.value.trim()
	if (!name) return
	await run(addLabel({ name, color: hex(newColor.value) }))
	newName.value = ''
	newColor.value = 'f59e0b'
}

function rename(id: string, name: string) {
	const trimmed = name.trim()
	if (trimmed) void run(updateLabel(id, { name: trimmed }))
}

function recolor(id: string, color: string) {
	void run(updateLabel(id, { color: hex(color) }))
}

function confirmDelete(id: string, name: string) {
	confirm.require({
		message: `Delete label "${name}"? It is removed from all todos.`,
		header: 'Delete label',
		icon: 'pi pi-trash',
		rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
		acceptProps: { label: 'Delete', severity: 'danger' },
		accept: () => run(deleteLabel(id)),
	})
}
</script>

<template>
	<Dialog
		:visible="visible"
		header="Labels"
		modal
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<div class="dialog-form">
			<div class="label-rows">
				<div v-for="label in state.labels" :key="label.id ?? ''" class="label-row">
					<ColorPicker
						:model-value="label.color.replace('#', '')"
						@update:model-value="recolor(label.id as string, String($event))"
					/>
					<InputText
						:model-value="label.name"
						class="grow"
						size="small"
						@change="rename(label.id as string, ($event.target as HTMLInputElement).value)"
					/>
					<Button
						icon="pi pi-trash"
						text
						rounded
						size="small"
						severity="secondary"
						@click="confirmDelete(label.id as string, label.name)"
					/>
				</div>
				<p v-if="!state.labels.length" style="color: var(--app-text-muted); margin: 0">
					No labels yet.
				</p>
			</div>

			<div class="label-row" style="border-top: 1px solid var(--app-border); padding-top: 0.75rem">
				<ColorPicker v-model="newColor" />
				<InputText
					v-model="newName"
					class="grow"
					size="small"
					placeholder="New label"
					@keyup.enter="create"
				/>
				<Button icon="pi pi-plus" size="small" :disabled="!newName.trim()" @click="create" />
			</div>
		</div>
	</Dialog>
</template>
