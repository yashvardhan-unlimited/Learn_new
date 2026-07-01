import { useEffect, useState } from 'react'
import { createTask, deleteAttachment, deleteTask, downloadAttachment, getTasks, updateTask, uploadAttachment } from '../api/tasks'
import type { Attachment, TaskCreate, TaskItem, TaskUpdate } from '../types/task'

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getTasks()
      .then((loaded) => active && setTasks(loaded))
      .catch((reason) => active && setError(errorText(reason, 'Unable to load tasks')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  function addDraft(): void {
    const now = new Date().toISOString()
    setError('')
    setTasks((current) => [{
      id: `draft-${crypto.randomUUID()}`,
      title: 'Untitled task',
      description: 'Add a description',
      status: 'pending',
      priority: 'medium',
      created_at: now,
      updated_at: now,
      attachments: [],
      isDraft: true,
    }, ...current])
  }

  async function saveTask(id: string, update: TaskUpdate): Promise<void> {
    try {
      setError('')
      const currentTask = tasks.find((task) => task.id === id)
      if (!currentTask) return
      const saved = currentTask.isDraft
        ? await createTask(toCreatePayload(currentTask, update))
        : await updateTask(id, update)
      setTasks((current) => current.map((task) => task.id === id ? saved : task))
    } catch (reason) {
      setError(errorText(reason, 'Unable to save task'))
    }
  }

  async function removeTask(id: string): Promise<void> {
    try {
      setError('')
      const currentTask = tasks.find((task) => task.id === id)
      if (currentTask?.isDraft) {
        setTasks((current) => current.filter((task) => task.id !== id))
        return
      }
      await deleteTask(id)
      setTasks((current) => current.filter((task) => task.id !== id))
    } catch (reason) {
      setError(errorText(reason, 'Unable to delete task'))
    }
  }

  async function attachFile(taskId: string, file: File): Promise<void> {
    try {
      setError('')
      const updated = await uploadAttachment(taskId, file)
      replaceTask(taskId, updated)
    } catch (reason) {
      setError(errorText(reason, 'Unable to upload attachment'))
      throw reason
    }
  }

  async function removeAttachment(taskId: string, attachmentId: string): Promise<void> {
    try {
      setError('')
      const updated = await deleteAttachment(taskId, attachmentId)
      replaceTask(taskId, updated)
    } catch (reason) {
      setError(errorText(reason, 'Unable to delete attachment'))
      throw reason
    }
  }

  async function downloadFile(taskId: string, attachment: Attachment): Promise<void> {
    try {
      setError('')
      const blob = await downloadAttachment(taskId, attachment.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setError(errorText(reason, 'Unable to download attachment'))
      throw reason
    }
  }

  function replaceTask(id: string, replacement: TaskItem): void {
    setTasks((current) => current.map((task) => task.id === id ? replacement : task))
  }

  return { tasks, loading, error, addDraft, saveTask, removeTask, attachFile, removeAttachment, downloadFile }
}

function toCreatePayload(task: TaskItem, update: TaskUpdate): TaskCreate {
  return {
    title: update.title ?? task.title,
    description: update.description ?? task.description,
    status: update.status ?? task.status,
    priority: update.priority ?? task.priority,
  }
}

function errorText(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}
