import type { SortDirection, SortField } from '../types/sort'
import type { TaskItem } from '../types/task'

export function sortTasks(tasks: TaskItem[], field: SortField, direction: SortDirection): TaskItem[] {
  return [...tasks].sort((first, second) => {
    if (first.isDraft !== second.isDraft) return first.isDraft ? -1 : 1
    const firstValue = comparableValue(first, field)
    const secondValue = comparableValue(second, field)
    const comparison = firstValue < secondValue ? -1 : firstValue > secondValue ? 1 : 0
    return direction === 'asc' ? comparison : -comparison
  })
}

function comparableValue(task: TaskItem, field: SortField): string | number {
  if (field === 'title') return task.title.toLocaleLowerCase()
  if (field === 'priority') return { low: 1, medium: 2, high: 3 }[task.priority]
  if (field === 'status') return { pending: 1, in_progress: 2, completed: 3 }[task.status]
  if (field === 'due_at') return task.due_at ? new Date(task.due_at).getTime() : Number.MAX_SAFE_INTEGER
  return new Date(task[field]).getTime()
}
