import { useEffect, useState } from 'react'
import type { Attachment, TaskItem, TaskPriority, TaskStatus, TaskUpdate } from '../types/task'
import { LoadingIndicator } from './LoadingIndicator'

// TaskCard receives task data plus functions owned by its parent. It does not
// directly fetch the full task list itself.
interface TaskCardProps {
  task: TaskItem
  viewMode?: 'cards' | 'list'
  onSave: (id: string, update: TaskUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAttach: (id: string, file: File) => Promise<void>
  onDeleteAttachment: (taskId: string, attachmentId: string) => Promise<void>
  onViewAttachment: (taskId: string, attachment: Attachment) => Promise<void>
  onSetReminder: (taskId: string, remove: boolean) => Promise<string>
}

export function TaskCard({ task, viewMode = 'cards', onSave, onDelete, onAttach, onDeleteAttachment, onViewAttachment, onSetReminder }: TaskCardProps) {
  // draft stores edits locally, so typing does not immediately update FastAPI.
  const [draft, setDraft] = useState<TaskUpdate>(task)
  // A union state records which action is running, or null when idle.
  const [busy, setBusy] = useState<'save' | 'delete' | 'reminder' | null>(null)
  const [attachmentBusy, setAttachmentBusy] = useState<string | null>(null)
  const [reminderMessage, setReminderMessage] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [expanded, setExpanded] = useState(task.isDraft === true)

  // When fresh task props arrive after a reload, replace the local draft.
  useEffect(() => setDraft(task), [task])

  // Compare only the editable fields. When one differs from the last task sent
  // by the backend, the Save button becomes green to remind the user to save.
  const hasUnsavedChanges =
    task.isDraft === true ||
    (draft.title ?? '') !== task.title ||
    (draft.description ?? '') !== task.description ||
    draft.status !== task.status ||
    draft.priority !== task.priority ||
    draft.due_at !== task.due_at

  const deadlineState = getDeadlineState(task.due_at, task.status)

  // One helper handles the shared loading-state behavior for both buttons.
  async function perform(action: 'save' | 'delete') {
    setBusy(action)
    try {
      if (action === 'save') {
        await onSave(task.id, draft)
        setJustSaved(true)
        window.setTimeout(() => setJustSaved(false), 900)
      } else {
        setIsExiting(true)
        await wait(220)
        await onDelete(task.id)
      }
    } catch {
      setIsExiting(false)
      setConfirmDelete(false)
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

  async function changeReminder(): Promise<void> {
    setBusy('reminder')
    setReminderMessage('')
    try {
      setReminderMessage(await onSetReminder(task.id, Boolean(task.reminder_event_id)))
    } finally {
      setBusy(null)
    }
  }

  async function attachmentAction(action: 'view' | 'delete', attachment: Attachment): Promise<void> {
    setAttachmentBusy(`${action}-${attachment.id}`)
    try {
      if (action === 'view') await onViewAttachment(task.id, attachment)
      else await onDeleteAttachment(task.id, attachment.id)
    } finally {
      setAttachmentBusy(null)
    }
  }

  const appearance = getCardAppearance(draft.status ?? task.status, draft.priority ?? task.priority, task.isDraft === true)

  if (viewMode === 'list' && !expanded) {
    return (
      <article className={`task-card task-card-enter ${task.isDraft ? 'task-card-draft' : ''} relative flex items-center gap-4 overflow-hidden rounded-xl border px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${appearance.card}`}>
        <div className={`absolute inset-y-0 left-0 w-1.5 ${appearance.accent}`} aria-hidden="true" />
        <div className="min-w-0 flex-1 pl-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold text-slate-900">{task.title}</h2>
            {task.isDraft && <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Unsaved</span>}
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">{task.description || 'No description'}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${appearance.badge}`}>{task.status.replace('_', ' ')}</span>
          <p className={`mt-2 text-xs font-semibold capitalize ${appearance.priorityText}`}>{task.priority} priority</p>
        </div>
        <div className="hidden w-40 shrink-0 text-right text-xs text-slate-500 lg:block">
          {task.due_at ? `Due ${new Date(task.due_at).toLocaleDateString()}` : 'No due date'}
        </div>
        <button onClick={() => setExpanded(true)} className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">Edit</button>
      </article>
    )
  }

  return (
    <article className={`task-card ${task.isDraft ? 'task-card-draft' : ''} relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${appearance.card} ${task.isDraft ? 'task-card-enter' : ''} ${isExiting ? 'task-card-exit pointer-events-none' : ''} ${justSaved ? 'task-card-saved' : ''}`}>
      <div className={`absolute inset-y-0 left-0 w-1.5 ${appearance.accent}`} aria-hidden="true" />
      <div className="mb-3 flex items-center justify-between gap-3 pl-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${appearance.badge}`}>
            {(draft.status ?? task.status).replace('_', ' ')}
          </span>
          {task.isDraft && <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">Unsaved draft</span>}
        </div>
        <span className={`text-xs font-semibold capitalize ${appearance.priorityText}`}>
          {draft.priority ?? task.priority} priority
        </span>
      </div>
      {viewMode === 'list' && <button onClick={() => setExpanded(false)} className="absolute right-4 top-14 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-white hover:text-slate-800">Collapse</button>}
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
        <label className="col-span-2 text-xs font-medium text-slate-600">
          Due date and time
          <input
            aria-label="Task due date and time"
            type="datetime-local"
            value={toDateTimeLocal(draft.due_at)}
            onChange={(event) => setDraft({
              ...draft,
              due_at: event.target.value ? new Date(event.target.value).toISOString() : null,
            })}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-indigo-500"
          />
        </label>
      </div>
      {task.due_at && (
        <p className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${deadlineState.className}`}>
          {deadlineState.label}: {new Date(task.due_at).toLocaleString()}
        </p>
      )}
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
                  <button disabled={attachmentBusy !== null} onClick={() => void attachmentAction('view', attachment)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                    {attachmentBusy === `view-${attachment.id}` ? 'Opening…' : 'View'}
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
      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
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
        {confirmDelete ? (
          <div className="task-confirm-enter flex items-center gap-2 rounded-xl bg-red-50 p-1.5" role="group" aria-label="Confirm task deletion">
            <span className="pl-2 text-xs font-semibold text-red-700">Delete permanently?</span>
            <button disabled={busy !== null} onClick={() => void perform('delete')} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50">
              {busy === 'delete' ? <LoadingIndicator label="Deleting…" light compact /> : 'Yes, delete'}
            </button>
            <button disabled={busy !== null} onClick={() => setConfirmDelete(false)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50">Cancel</button>
          </div>
        ) : (
          <button disabled={busy !== null} onClick={() => setConfirmDelete(true)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">Delete</button>
        )}
        <button title={!task.due_at ? 'Set and save a due date first' : task.reminder_event_id ? 'Remove this event from Google Calendar' : 'Add this task to Google Calendar'} disabled={busy !== null || task.isDraft || (!task.due_at && !task.reminder_event_id)} onClick={() => void changeReminder()} className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${task.reminder_event_id ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
          {busy === 'reminder' ? <LoadingIndicator label={task.reminder_event_id ? 'Removing…' : 'Adding…'} compact /> : task.reminder_event_id ? 'Remove reminder' : 'Add reminder'}
        </button>
      </div>
      {reminderMessage && <p className="mt-3 text-xs font-medium text-emerald-700">{reminderMessage}</p>}
    </article>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function getDeadlineState(dueAt: string | null, status: TaskStatus): { label: string; className: string } {
  if (!dueAt) return { label: '', className: '' }
  if (status === 'completed') return { label: 'Completed task deadline', className: 'bg-emerald-50 text-emerald-700' }
  const millisecondsLeft = new Date(dueAt).getTime() - Date.now()
  if (millisecondsLeft < 0) return { label: 'Overdue', className: 'bg-red-50 text-red-700' }
  if (millisecondsLeft <= 24 * 60 * 60 * 1000) return { label: 'Due soon', className: 'bg-amber-50 text-amber-800' }
  return { label: 'Due', className: 'bg-indigo-50 text-indigo-700' }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function getCardAppearance(status: TaskStatus, priority: TaskPriority, isDraft: boolean) {
  if (isDraft) return {
    card: 'border-violet-300 bg-gradient-to-br from-violet-100 to-fuchsia-50',
    badge: 'bg-white/80 text-violet-800',
    accent: 'bg-violet-600',
    priorityText: 'text-violet-700',
  }
  const statusStyles = {
    completed: {
      card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
      badge: 'bg-emerald-100 text-emerald-800',
      accent: 'bg-emerald-500',
    },
    in_progress: {
      card: 'border-blue-200 bg-gradient-to-br from-blue-50 to-white',
      badge: 'bg-blue-100 text-blue-800',
      accent: 'bg-blue-500',
    },
    pending: {
      card: 'border-amber-200 bg-gradient-to-br from-amber-50/70 to-white',
      badge: 'bg-amber-100 text-amber-800',
      accent: 'bg-amber-500',
    },
  }[status]
  const priorityText = priority === 'high' ? 'text-red-600' : priority === 'medium' ? 'text-amber-700' : 'text-slate-500'
  return { ...statusStyles, priorityText }
}
