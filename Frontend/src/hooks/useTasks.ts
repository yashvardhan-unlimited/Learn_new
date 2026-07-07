import { useEffect, useState } from 'react'
import { addTaskReminder, createTask, deleteAttachment, deleteTask, downloadAttachment, getTasks, removeTaskReminder, updateTask, uploadAttachment } from '../api/tasks'
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

  async function refreshTasks(): Promise<void> {
    try {
      setError('')
      setTasks(await getTasks())
    } catch (reason) {
      setError(errorText(reason, 'Unable to refresh tasks'))
      throw reason
    }
  }

  function addDraft(): void {
    const now = new Date().toISOString()
    setError('')
    setTasks((current) => [{
      id: `draft-${crypto.randomUUID()}`,
      title: 'Untitled task',
      description: 'Add a description',
      status: 'pending',
      priority: 'medium',
      due_at: null,
      reminder_event_id: null,
      reminder_calendar_url: null,
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
      throw reason
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
      throw reason
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

  async function viewFile(taskId: string, attachment: Attachment): Promise<void> {
    const preview = window.open('', '_blank')
    if (!preview) throw new Error('Allow pop-ups to preview attachments.')
    preview.opener = null
    preview.document.body.textContent = 'Loading attachment preview…'
    try {
      setError('')
      const blob = await downloadAttachment(taskId, attachment.id)
      const url = URL.createObjectURL(blob)
      preview.location.href = url
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (reason) {
      preview.close()
      setError(errorText(reason, 'Unable to preview attachment'))
      throw reason
    }
  }

  async function setReminder(taskId: string, remove: boolean): Promise<string> {
    try {
      setError('')
      const response = remove ? await removeTaskReminder(taskId) : await addTaskReminder(taskId)
      if (response.redirect_url) {
        window.location.assign(response.redirect_url)
        return 'Redirecting to Google…'
      }
      if (response.task) replaceTask(taskId, response.task)
      return response.message
    } catch (reason) {
      const message = errorText(reason, 'Unable to add Google Calendar reminder')
      setError(message)
      throw reason
    }
  }

  function replaceTask(id: string, replacement: TaskItem): void {
    setTasks((current) => current.map((task) => task.id === id ? replacement : task))
  }

  return { tasks, loading, error, refreshTasks, addDraft, saveTask, removeTask, attachFile, removeAttachment, viewFile, setReminder }
}

function toCreatePayload(task: TaskItem, update: TaskUpdate): TaskCreate {
  return {
    title: update.title ?? task.title,
    description: update.description ?? task.description,
    status: update.status ?? task.status,
    priority: update.priority ?? task.priority,
    due_at: update.due_at === undefined ? task.due_at : update.due_at,
  }
}

function errorText(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}
