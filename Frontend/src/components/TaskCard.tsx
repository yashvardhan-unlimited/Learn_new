import { useEffect, useState } from 'react'
import type { Attachment, TaskItem, TaskPriority, TaskStatus, TaskUpdate } from '../types/task'
import { LoadingIndicator } from './LoadingIndicator'

// TaskCard receives task data plus functions owned by its parent. It does not
// directly fetch the full task list itself.
interface TaskCardProps {
  task: TaskItem
  onSave: (id: string, update: TaskUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAttach: (id: string, file: File) => Promise<void>
  onDeleteAttachment: (taskId: string, attachmentId: string) => Promise<void>
  onDownloadAttachment: (taskId: string, attachment: Attachment) => Promise<void>
}

export function TaskCard({ task, onSave, onDelete, onAttach, onDeleteAttachment, onDownloadAttachment }: TaskCardProps) {
  // draft stores edits locally, so typing does not immediately update FastAPI.
  const [draft, setDraft] = useState<TaskUpdate>(task)
  // A union state records which action is running, or null when idle.
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null)
  const [attachmentBusy, setAttachmentBusy] = useState<string | null>(null)

  // When fresh task props arrive after a reload, replace the local draft.
  useEffect(() => setDraft(task), [task])

  // Compare only the editable fields. When one differs from the last task sent
  // by the backend, the Save button becomes green to remind the user to save.
  const hasUnsavedChanges =
    task.isDraft === true ||
    (draft.title ?? '') !== task.title ||
    (draft.description ?? '') !== task.description ||
    draft.status !== task.status ||
    draft.priority !== task.priority

  // One helper handles the shared loading-state behavior for both buttons.
  async function perform(action: 'save' | 'delete') {
    setBusy(action)
    try {
      if (action === 'save') await onSave(task.id, draft)
      else await onDelete(task.id)
    } finally {
      setBusy(null)
    }
  }

  async function upload(file: File): Promise<void> {
    setAttachmentBusy('upload')
    try {
      await onAttach(task.id, file)
    } finally {
      setAttachmentBusy(null)
    }
  }

  async function attachmentAction(action: 'download' | 'delete', attachment: Attachment): Promise<void> {
    setAttachmentBusy(`${action}-${attachment.id}`)
    try {
      if (action === 'download') await onDownloadAttachment(task.id, attachment)
      else await onDeleteAttachment(task.id, attachment.id)
    } finally {
      setAttachmentBusy(null)
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <input
        aria-label="Task title"
        // ?? uses an empty string only when draft.title is null or undefined.
        value={draft.title ?? ''}
        // Spread copies the old draft; the later title property replaces title.
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        className="w-full rounded-lg border border-transparent px-2 py-1 text-lg font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
      <textarea
        aria-label="Task description"
        rows={3}
        value={draft.description ?? ''}
        onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        className="mt-2 w-full resize-y rounded-lg border border-transparent px-2 py-1.5 text-sm leading-6 text-slate-600 outline-none hover:border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <select aria-label="Task status" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TaskStatus })} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm capitalize outline-none focus:border-indigo-500">
          <option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
        </select>
        <select aria-label="Task priority" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as TaskPriority })} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm capitalize outline-none focus:border-indigo-500">
          <option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option>
        </select>
      </div>
      <div className="mt-4 space-y-1 text-xs text-slate-400">
        {/* Convert ISO timestamp strings from FastAPI into local date text. */}
        {task.isDraft ? (
          <p className="font-medium text-emerald-600">Not saved to the database yet</p>
        ) : (
          <><p>Created {new Date(task.created_at).toLocaleString()}</p><p>Updated {new Date(task.updated_at).toLocaleString()}</p></>
        )}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Attachments</h3>
          <label className={`rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${task.isDraft || attachmentBusy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
            {attachmentBusy === 'upload' ? 'Uploading…' : 'Attach file'}
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/gif,image/webp"
              disabled={task.isDraft || attachmentBusy !== null}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void upload(file)
                event.target.value = ''
              }}
            />
          </label>
        </div>
        {task.isDraft && <p className="mt-2 text-xs text-slate-400">Save this task before adding attachments.</p>}
        {!task.isDraft && !task.attachments.length && <p className="mt-2 text-xs text-slate-400">No attachments yet.</p>}
        {!!task.attachments.length && (
          <ul className="mt-3 space-y-2">
            {task.attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{attachment.filename}</p>
                  <p className="text-[11px] text-slate-400">{formatFileSize(attachment.size)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={attachmentBusy !== null} onClick={() => void attachmentAction('download', attachment)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                    {attachmentBusy === `download-${attachment.id}` ? 'Loading…' : 'Download'}
                  </button>
                  <button disabled={attachmentBusy !== null} onClick={() => void attachmentAction('delete', attachment)} className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50">
                    {attachmentBusy === `delete-${attachment.id}` ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
        <button
          disabled={busy !== null || !draft.title?.trim()}
          onClick={() => void perform('save')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
            hasUnsavedChanges
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-slate-900 hover:bg-slate-700'
          }`}
        >
          {busy === 'save' ? <LoadingIndicator label="Saving…" light compact /> : 'Save'}
        </button>
        <button disabled={busy !== null} onClick={() => void perform('delete')} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
          {busy === 'delete' ? <LoadingIndicator label="Deleting…" compact /> : 'Delete'}
        </button>
      </div>
    </article>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
