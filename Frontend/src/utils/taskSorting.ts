import type { SortDirection, SortField } from '../types/sort'
import type { TaskItem } from '../types/task'

export function sortTasks(tasks: TaskItem[], field: SortField, direction: SortDirection): TaskItem[] {
  return [...tasks].sort((first, second) => {
    const firstValue = comparableValue(first, field)
    const secondValue = comparableValue(second, field)
    const comparison = firstValue < secondValue ? -1 : firstValue > secondValue ? 1 : 0
    return direction === 'asc' ? comparison : -comparison
  })
}

function comparableValue(task: TaskItem, field: SortField): string | number {
  return field === 'title' ? task.title.toLocaleLowerCase() : new Date(task[field]).getTime()
}
