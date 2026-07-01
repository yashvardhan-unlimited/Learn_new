// "import type" is removed from the final JavaScript. These imports only help
// TypeScript check that requests and responses use the expected data shapes.
import type { Task, TaskCreate, TaskUpdate } from '../types/task' 
import { apiRequest, authorizedFetch } from './client'

// Each exported function represents one backend endpoint. Components import
// these functions instead of repeating fetch logic throughout the UI.

export function getTasks(): Promise<Task[]> {
  return apiRequest<Task[]>('/tasks')
}


export function createTask(task: TaskCreate): Promise<Task> {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    // The header tells FastAPI that the body contains JSON.
    headers: { 'Content-Type': 'application/json' },
    // JSON.stringify converts a JavaScript object into text for the request.
    body: JSON.stringify(task),
  })
}


export function updateTask(taskId: string, taskUpdate: TaskUpdate): Promise<Task> {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskUpdate),
  })
}


export function deleteTask(taskId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' })
}

export function uploadAttachment(taskId: string, file: File): Promise<Task> {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<Task>(`/tasks/${encodeURIComponent(taskId)}/attachments`, {
    method: 'POST',
    body: form,
  })
}

export function deleteAttachment(taskId: string, attachmentId: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(taskId)}/attachments/${encodeURIComponent(attachmentId)}`, { method: 'DELETE' })
}

export async function downloadAttachment(taskId: string, attachmentId: string): Promise<Blob> {
  const response = await authorizedFetch(`/tasks/${encodeURIComponent(taskId)}/attachments/${encodeURIComponent(attachmentId)}`)
  if (!response.ok) throw new Error('Unable to download attachment')
  return response.blob()
}


export async function summarizeTasks(onChunk: (chunk: string) => void): Promise<void> {
  const response = await authorizedFetch('/tasks/summarize', { method: 'POST' })
  if (!response.ok) throw new Error('Unable to summarize tasks')
  if (!response.body) throw new Error('Streaming is not supported by this browser')

  // A reader receives the response a piece at a time. TextDecoder converts each
  // binary Uint8Array piece into normal JavaScript text.
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  // Continue reading until the backend closes the stream.
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    // Call the function supplied by SummaryPanel with each new text piece.
    onChunk(decoder.decode(value, { stream: true }))
  }

  // Flush any bytes that remained inside TextDecoder after the final read.
  const finalChunk = decoder.decode()
  if (finalChunk) onChunk(finalChunk)
}
