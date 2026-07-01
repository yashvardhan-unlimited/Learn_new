import type { Attachment, TaskItem, TaskUpdate } from '../types/task'
import { TaskCard } from './TaskCard'
import { LoadingIndicator } from './LoadingIndicator'

// The component contract makes missing or incorrectly typed props a TypeScript
// error before the application runs in the browser.
interface TaskListProps {
  tasks: TaskItem[]
  loading: boolean
  onSave: (id: string, update: TaskUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAttach: (id: string, file: File) => Promise<void>
  onDeleteAttachment: (taskId: string, attachmentId: string) => Promise<void>
  onDownloadAttachment: (taskId: string, attachment: Attachment) => Promise<void>
}

export function TaskList({ tasks, loading, onSave, onDelete, onAttach, onDeleteAttachment, onDownloadAttachment }: TaskListProps) {
  // Early returns make loading and empty states easy to read.
  if (loading) return <LoadingIndicator label="Loading tasks…" />
  if (!tasks.length) return <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center"><p className="font-medium text-slate-700">No tasks yet</p><p className="mt-1 text-sm text-slate-500">Create your first task to get started.</p></div>

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* map converts every task object into one TaskCard component. */}
      {tasks.map((task) => (
        <TaskCard
          // React uses key to track list items efficiently between renders.
          key={task.id}
          task={task}
          onSave={onSave}
          onDelete={onDelete}
          onAttach={onAttach}
          onDeleteAttachment={onDeleteAttachment}
          onDownloadAttachment={onDownloadAttachment}
        />
      ))}
    </div>
  )
}
