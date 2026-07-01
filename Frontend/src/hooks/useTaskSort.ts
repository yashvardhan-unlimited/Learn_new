import { useMemo, useState } from 'react'
import type { SortDirection, SortField } from '../types/sort'
import type { TaskItem } from '../types/task'
import { sortTasks } from '../utils/taskSorting'

export function useTaskSort(tasks: TaskItem[]) {
  const [field, setField] = useState<SortField>('created_at')
  const [direction, setDirection] = useState<SortDirection>('desc')
  const sortedTasks = useMemo(() => sortTasks(tasks, field, direction), [tasks, field, direction])
  return { field, direction, sortedTasks, setField, setDirection }
}
