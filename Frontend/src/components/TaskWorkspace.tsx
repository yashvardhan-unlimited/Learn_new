import type { Attachment, TaskItem, TaskUpdate } from '../types/task'
import { TaskList } from './TaskList'

interface TaskWorkspaceProps {
  tasks: TaskItem[]
  loading: boolean
  error: string
  onCreate: () => void
  onSave: (id: string, update: TaskUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAttach: (id: string, file: File) => Promise<void>
  onDeleteAttachment: (taskId: string, attachmentId: string) => Promise<void>
  onDownloadAttachment: (taskId: string, attachment: Attachment) => Promise<void>
}

export function TaskWorkspace(props: TaskWorkspaceProps) {
  const { tasks, loading, error, onCreate, onSave, onDelete, onAttach, onDeleteAttachment, onDownloadAttachment } = props
  return (
    <div className="p-5 sm:p-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Task workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">My tasks</h1>
        </div>
        <button onClick={onCreate} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Create Task</button>
      </header>
      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <TaskList tasks={tasks} loading={loading} onSave={onSave} onDelete={onDelete} onAttach={onAttach} onDeleteAttachment={onDeleteAttachment} onDownloadAttachment={onDownloadAttachment} />
    </div>
  )
}
