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
  onViewAttachment: (taskId: string, attachment: Attachment) => Promise<void>
  onSetReminder: (taskId: string, remove: boolean) => Promise<string>
}

export function TaskList({ tasks, loading, onSave, onDelete, onAttach, onDeleteAttachment, onViewAttachment, onSetReminder }: TaskListProps) {
  // Early returns make loading and empty states easy to read.
  if (loading) return <LoadingIndicator label="Loading tasks…" />
  return (
    <>
      {!tasks.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center">
          <p className="font-medium text-slate-700">No tasks match these filters</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onSave={onSave} onDelete={onDelete} onAttach={onAttach} onDeleteAttachment={onDeleteAttachment} onViewAttachment={onViewAttachment} onSetReminder={onSetReminder} />
          ))}
        </div>
      )}
    </>
  )
}
