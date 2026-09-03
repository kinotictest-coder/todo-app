// Single import path for the domain entity shapes. These are the classes defined in
// packages/domain/model/*.ts — imported as types only, so nothing from the domain
// package ends up in the browser bundle here (the repositories in the store do).
export type { Todo } from '@todo-app/domain'
export type { TodoList } from '@todo-app/domain'
export type { Label } from '@todo-app/domain'

export type Priority = 'low' | 'normal' | 'high'
export type StatusFilter = 'all' | 'active' | 'done'

/** The left-nav selection: every todo, the inbox (no list), or one list's id. */
export type ActiveView = 'all' | 'inbox' | { listId: string }
