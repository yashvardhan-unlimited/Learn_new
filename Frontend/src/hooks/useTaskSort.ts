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
  const sortedTasks = useMemo(() => sortTasks(tasks
    .filter((task) => task.isDraft || status === 'all' || task.status === status)
    .filter((task) => task.isDraft || priority === 'all' || task.priority === priority)
    .filter((task) => task.isDraft || matchesDeadline(task, deadline)), field, direction), [tasks, field, direction, status, priority, deadline])
  const filtersActive = status !== 'all' || priority !== 'all' || deadline !== 'all'
  const clearFilters = () => { setStatus('all'); setPriority('all'); setDeadline('all') }
  return { field, direction, status, priority, deadline, sortedTasks, filtersActive, setField, setDirection, setStatus, setPriority, setDeadline, clearFilters }
}

function matchesDeadline(task: TaskItem, filter: DeadlineFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'none') return !task.due_at
  if (filter === 'scheduled') return Boolean(task.due_at)
  if (!task.due_at || task.status === 'completed') return false
  const millisecondsLeft = new Date(task.due_at).getTime() - Date.now()
  return filter === 'overdue' ? millisecondsLeft < 0 : millisecondsLeft >= 0 && millisecondsLeft <= 86_400_000
}
