import { useMemo, useState } from 'react'
import type { DeadlineFilter, PriorityFilter, SortDirection, SortField, StatusFilter } from '../types/sort'
import type { TaskItem } from '../types/task'
import { sortTasks } from '../utils/taskSorting'

export function useTaskSort(tasks: TaskItem[]) {
  const [field, setField] = useState<SortField>('due_at')
  const [direction, setDirection] = useState<SortDirection>('asc')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [priority, setPriority] = useState<PriorityFilter>('all')
  const [deadline, setDeadline] = useState<DeadlineFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const sortedTasks = useMemo(() => sortTasks(tasks
    .filter((task) => task.isDraft || status === 'all' || task.status === status)
    .filter((task) => task.isDraft || priority === 'all' || task.priority === priority)
    .filter((task) => task.isDraft || matchesDeadline(task, deadline))
    .filter((task) => matchesSearch(task, searchQuery)), field, direction), [tasks, field, direction, status, priority, deadline, searchQuery])
  const filtersActive = status !== 'all' || priority !== 'all' || deadline !== 'all' || searchQuery.trim() !== ''
  const clearFilters = () => { setStatus('all'); setPriority('all'); setDeadline('all'); setSearchQuery('') }
  return { field, direction, status, priority, deadline, searchQuery, sortedTasks, filtersActive, setField, setDirection, setStatus, setPriority, setDeadline, setSearchQuery, clearFilters }
}

function matchesDeadline(task: TaskItem, filter: DeadlineFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'none') return !task.due_at
  if (filter === 'scheduled') return Boolean(task.due_at)
  if (!task.due_at || task.status === 'completed') return false
  const millisecondsLeft = new Date(task.due_at).getTime() - Date.now()
  return filter === 'overdue' ? millisecondsLeft < 0 : millisecondsLeft >= 0 && millisecondsLeft <= 86_400_000
}

function matchesSearch(task: TaskItem, query: string): boolean {
  const tokens = query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (!tokens.length) return true
  const searchableText = [
    task.title,
    task.description,
    task.status.replace('_', ' '),
    task.priority,
    task.due_at ? new Date(task.due_at).toLocaleString() : 'no deadline',
    ...task.attachments.map((attachment) => attachment.filename),
  ].join(' ').toLocaleLowerCase()
  return tokens.every((token) => searchableText.includes(token))
}
