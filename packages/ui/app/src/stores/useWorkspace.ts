import { Pageable } from '@kinotic-ai/core'
import { LabelRepository, TodoListRepository, TodoRepository } from '@todo-app/domain'
import { computed, reactive } from 'vue'
import type { ActiveView, Label, Priority, StatusFilter, Todo, TodoList } from '../kinotic/types'

const page = () => Pageable.create(0, 1000)
const now = () => Date.now()

// Repositories are constructed lazily — only after login() has run
// Kinotic.use(PersistencePlugin) and connect().
let _todoRepo: TodoRepository | undefined
let _listRepo: TodoListRepository | undefined
let _labelRepo: LabelRepository | undefined
const todoRepo = () => (_todoRepo ??= new TodoRepository())
const listRepo = () => (_listRepo ??= new TodoListRepository())
const labelRepo = () => (_labelRepo ??= new LabelRepository())

export interface TodoInput {
	title: string
	description?: string
	priority?: Priority
	listId?: string
	labelIds?: string[]
	dueDate?: number | null
}

export type TodoPatch = Partial<{
	title: string
	description: string
	priority: Priority
	listId: string
	labelIds: string[]
	dueDate: number | null
	completed: boolean
}>

interface WorkspaceState {
	lists: TodoList[]
	labels: Label[]
	allTodos: Todo[]
	activeView: ActiveView
	filter: { labelId: string | null; status: StatusFilter; search: string }
	loading: boolean
	error: string | null
}

const state = reactive<WorkspaceState>({
	lists: [],
	labels: [],
	allTodos: [],
	activeView: 'all',
	filter: { labelId: null, status: 'all', search: '' },
	loading: false,
	error: null,
})

function activeListId(): string | null {
	if (state.activeView === 'all') return null
	if (state.activeView === 'inbox') return ''
	return state.activeView.listId
}

const activeLists = computed(() => state.lists.filter((l) => !l.archived).sort(byPosition))
const archivedLists = computed(() => state.lists.filter((l) => l.archived).sort(byPosition))
const labelsById = computed(() => new Map(state.labels.map((l) => [l.id as string, l])))

const visibleTodos = computed<Todo[]>(() => {
	const listId = activeListId()
	const { labelId, status, search } = state.filter
	const term = search.trim().toLowerCase()
	return state.allTodos
		.filter((t) => (listId === null ? true : t.listId === listId))
		.filter((t) => (status === 'all' ? true : status === 'done' ? t.completed : !t.completed))
		.filter((t) => (labelId ? t.labelIds.includes(labelId) : true))
		.filter(
			(t) =>
				!term ||
				t.title.toLowerCase().includes(term) ||
				t.description.toLowerCase().includes(term),
		)
		.sort((a, b) => Number(a.completed) - Number(b.completed) || a.position - b.position || a.createdAt - b.createdAt)
})

function countForView(view: ActiveView): number {
	const open = state.allTodos.filter((t) => !t.completed)
	if (view === 'all') return open.length
	if (view === 'inbox') return open.filter((t) => t.listId === '').length
	return open.filter((t) => t.listId === view.listId).length
}

function byPosition(a: { position: number }, b: { position: number }) {
	return a.position - b.position
}

// ---- loading -------------------------------------------------------------

async function refreshTodos() {
	state.allTodos = (await todoRepo().findAll(page())).content ?? []
}
async function refreshLists() {
	state.lists = (await listRepo().findAll(page())).content ?? []
}
async function refreshLabels() {
	state.labels = (await labelRepo().findAll(page())).content ?? []
}

async function loadAll() {
	state.loading = true
	state.error = null
	try {
		await Promise.all([refreshLists(), refreshLabels(), refreshTodos()])
	} catch (e) {
		state.error = e instanceof Error ? e.message : String(e)
		throw e
	} finally {
		state.loading = false
	}
}

function selectView(view: ActiveView) {
	state.activeView = view
	state.filter.search = ''
}

// ---- todos --------------------------------------------------------------

async function addTodo(input: TodoInput) {
	const listId = input.listId ?? (activeListId() ?? '')
	const siblings = state.allTodos.filter((t) => t.listId === listId)
	const position = siblings.length ? Math.max(...siblings.map((t) => t.position)) + 1 : 0
	await todoRepo().save({
		id: null,
		title: input.title.trim(),
		description: input.description?.trim() ?? '',
		completed: false,
		priority: input.priority ?? 'normal',
		listId,
		labelIds: input.labelIds ?? [],
		position,
		dueDate: input.dueDate ?? null,
		completedAt: null,
		createdAt: now(),
		updatedAt: now(),
	})
	await refreshTodos()
}

async function updateTodo(id: string, patch: TodoPatch) {
	const current = state.allTodos.find((t) => t.id === id)
	if (!current) return
	const merged: Todo = { ...current, ...patch, updatedAt: now() }
	if (patch.completed !== undefined && patch.completed !== current.completed) {
		merged.completedAt = patch.completed ? now() : null
	}
	await todoRepo().save(merged)
	await refreshTodos()
}

const toggleTodo = (id: string) => {
	const t = state.allTodos.find((x) => x.id === id)
	return t ? updateTodo(id, { completed: !t.completed }) : Promise.resolve()
}

async function deleteTodo(id: string) {
	await todoRepo().deleteById(id)
	await refreshTodos()
}

// ---- lists --------------------------------------------------------------

async function addList(input: { name: string; color?: string; description?: string }) {
	const position = state.lists.length ? Math.max(...state.lists.map((l) => l.position)) + 1 : 0
	await listRepo().save({
		id: null,
		name: input.name.trim(),
		color: input.color ?? '#64748b',
		description: input.description?.trim() ?? '',
		position,
		archived: false,
		createdAt: now(),
		updatedAt: now(),
	})
	await refreshLists()
}

async function updateList(id: string, patch: Partial<Pick<TodoList, 'name' | 'color' | 'description' | 'archived'>>) {
	const current = state.lists.find((l) => l.id === id)
	if (!current) return
	await listRepo().save({ ...current, ...patch, updatedAt: now() })
	await refreshLists()
}

const archiveList = (id: string, archived = true) => updateList(id, { archived })

async function deleteList(id: string) {
	const orphans = state.allTodos.filter((t) => t.listId === id)
	if (orphans.length) {
		await todoRepo().bulkSave(orphans.map((t) => ({ ...t, listId: '', updatedAt: now() })))
		await todoRepo().syncIndex()
	}
	await listRepo().deleteById(id)
	if (state.activeView !== 'all' && state.activeView !== 'inbox' && state.activeView.listId === id) {
		state.activeView = 'all'
	}
	await Promise.all([refreshLists(), refreshTodos()])
}

// ---- labels ------------------------------------------------------------

async function addLabel(input: { name: string; color?: string }) {
	await labelRepo().save({
		id: null,
		name: input.name.trim(),
		color: input.color ?? '#f59e0b',
		createdAt: now(),
		updatedAt: now(),
	})
	await refreshLabels()
}

async function updateLabel(id: string, patch: Partial<Pick<Label, 'name' | 'color'>>) {
	const current = state.labels.find((l) => l.id === id)
	if (!current) return
	await labelRepo().save({ ...current, ...patch, updatedAt: now() })
	await refreshLabels()
}

async function deleteLabel(id: string) {
	const tagged = state.allTodos.filter((t) => t.labelIds.includes(id))
	if (tagged.length) {
		await todoRepo().bulkSave(
			tagged.map((t) => ({ ...t, labelIds: t.labelIds.filter((l) => l !== id), updatedAt: now() })),
		)
		await todoRepo().syncIndex()
	}
	await labelRepo().deleteById(id)
	if (state.filter.labelId === id) state.filter.labelId = null
	await Promise.all([refreshLabels(), refreshTodos()])
}

export function useWorkspace() {
	return {
		state,
		activeLists,
		archivedLists,
		labelsById,
		visibleTodos,
		activeListId,
		countForView,
		loadAll,
		selectView,
		addTodo,
		updateTodo,
		toggleTodo,
		deleteTodo,
		addList,
		updateList,
		archiveList,
		deleteList,
		addLabel,
		updateLabel,
		deleteLabel,
	}
}
