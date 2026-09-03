<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Menu from 'primevue/menu'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { computed, nextTick, ref } from 'vue'
import type { TodoList } from '../kinotic/types'
import { useWorkspace } from '../stores/useWorkspace'
import LabelManagerDialog from './LabelManagerDialog.vue'

const { state, activeLists, archivedLists, countForView, selectView, addList, updateList, archiveList, deleteList } =
	useWorkspace()
const confirm = useConfirm()
const toast = useToast()

const adding = ref(false)
const newListName = ref('')
const editingId = ref<string | null>(null)
const editName = ref('')
const labelsOpen = ref(false)

const menu = ref<InstanceType<typeof Menu> | null>(null)
const menuTarget = ref<TodoList | null>(null)
const menuItems = computed(() => {
	const list = menuTarget.value
	if (!list) return []
	return [
		{ label: 'Rename', icon: 'pi pi-pencil', command: () => startRename(list) },
		list.archived
			? { label: 'Unarchive', icon: 'pi pi-inbox', command: () => run(archiveList(list.id as string, false)) }
			: { label: 'Archive', icon: 'pi pi-box', command: () => run(archiveList(list.id as string, true)) },
		{ separator: true },
		{
			label: 'Delete',
			icon: 'pi pi-trash',
			command: () =>
				confirm.require({
					message: `Delete "${list.name}"? Its todos move to Inbox.`,
					header: 'Delete list',
					icon: 'pi pi-exclamation-triangle',
					rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
					acceptProps: { label: 'Delete', severity: 'danger' },
					accept: () => run(deleteList(list.id as string)),
				}),
		},
	]
})

function openMenu(event: MouseEvent, list: TodoList) {
	menuTarget.value = list
	menu.value?.toggle(event)
}

function isActive(view: 'all' | 'inbox' | string) {
	if (view === 'all' || view === 'inbox') return state.activeView === view
	return state.activeView !== 'all' && state.activeView !== 'inbox' && state.activeView.listId === view
}

async function run(p: Promise<unknown>) {
	try {
		await p
	} catch (e) {
		toast.add({ severity: 'error', summary: 'Error', detail: msg(e), life: 5000 })
	}
}

async function confirmAdd() {
	const name = newListName.value.trim()
	if (!name) {
		adding.value = false
		return
	}
	await run(addList({ name }))
	newListName.value = ''
	adding.value = false
}

async function startRename(list: TodoList) {
	editingId.value = list.id as string
	editName.value = list.name
	await nextTick()
}

async function confirmRename(list: TodoList) {
	const name = editName.value.trim()
	if (name && name !== list.name) await run(updateList(list.id as string, { name }))
	editingId.value = null
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))
</script>

<template>
	<nav class="sidebar">
		<button class="nav-item" :class="{ 'nav-item--active': isActive('all') }" @click="selectView('all')">
			<i class="pi pi-list dot" style="background: none" />
			<span>All</span>
			<span class="nav-item__count">{{ countForView('all') }}</span>
		</button>
		<button class="nav-item" :class="{ 'nav-item--active': isActive('inbox') }" @click="selectView('inbox')">
			<i class="pi pi-inbox dot" style="background: none" />
			<span>Inbox</span>
			<span class="nav-item__count">{{ countForView('inbox') }}</span>
		</button>

		<div class="sidebar__section">Lists</div>
		<template v-for="list in activeLists" :key="list.id ?? ''">
			<div v-if="editingId === list.id" class="nav-item">
				<InputText
					v-model="editName"
					size="small"
					autofocus
					class="grow"
					@keyup.enter="confirmRename(list)"
					@blur="confirmRename(list)"
				/>
			</div>
			<button
				v-else
				class="nav-item"
				:class="{ 'nav-item--active': isActive(list.id as string) }"
				@click="selectView({ listId: list.id as string })"
			>
				<span class="dot" :style="{ background: list.color }" />
				<span class="grow" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{
					list.name
				}}</span>
				<span class="nav-item__count">{{ countForView({ listId: list.id as string }) }}</span>
				<i
					class="pi pi-ellipsis-h"
					style="padding: 0 0.15rem"
					@click.stop="openMenu($event, list)"
				/>
			</button>
		</template>

		<div v-if="adding" class="nav-item">
			<InputText
				v-model="newListName"
				size="small"
				placeholder="List name"
				autofocus
				class="grow"
				@keyup.enter="confirmAdd"
				@blur="confirmAdd"
			/>
		</div>
		<Button
			v-else
			label="Add list"
			icon="pi pi-plus"
			severity="secondary"
			text
			size="small"
			class="nav-item"
			@click="adding = true"
		/>

		<template v-if="archivedLists.length">
			<div class="sidebar__section">Archived</div>
			<button
				v-for="list in archivedLists"
				:key="list.id ?? ''"
				class="nav-item"
				:class="{ 'nav-item--active': isActive(list.id as string) }"
				@click="selectView({ listId: list.id as string })"
			>
				<span class="dot" :style="{ background: list.color, opacity: 0.5 }" />
				<span class="grow" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">{{
					list.name
				}}</span>
				<i class="pi pi-ellipsis-h" @click.stop="openMenu($event, list)" />
			</button>
		</template>

		<div style="margin-top: auto; padding-top: 1rem">
			<Button
				label="Manage labels"
				icon="pi pi-tag"
				severity="secondary"
				text
				size="small"
				class="nav-item"
				@click="labelsOpen = true"
			/>
		</div>

		<Menu ref="menu" :model="menuItems" :popup="true" />
		<LabelManagerDialog v-model:visible="labelsOpen" />
	</nav>
</template>
