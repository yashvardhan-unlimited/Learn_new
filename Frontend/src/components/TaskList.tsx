import type { Attachment, TaskItem, TaskUpdate } from '../types/task'
import { TaskCard } from './TaskCard'
import { LoadingIndicator } from './LoadingIndicator'

// The component contract makes missing or incorrectly typed props a TypeScript
// error before the application runs in the browser.
interface TaskListProps {
  tasks: TaskItem[]
  viewMode: 'cards' | 'list'
  loading: boolean
  onSave: (id: string, update: TaskUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAttach: (id: string, file: File) => Promise<void>
  onDeleteAttachment: (taskId: string, attachmentId: string) => Promise<void>
  onViewAttachment: (taskId: string, attachment: Attachment) => Promise<void>
  onSetReminder: (taskId: string, remove: boolean) => Promise<string>
}

export function TaskList({ tasks, viewMode, loading, onSave, onDelete, onAttach, onDeleteAttachment, onViewAttachment, onSetReminder }: TaskListProps) {
  // Early returns make loading and empty states easy to read.
  if (loading) return <LoadingIndicator label="Loading tasks…" />
  return (
    <>
      {!tasks.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/30 py-12 text-center backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/30">
          <p className="font-medium text-slate-700 dark:text-slate-300">No tasks match these filters</p>
        </div>
      ) : (
        <div className={viewMode === 'cards' ? 'grid gap-5 xl:grid-cols-2' : 'flex flex-col gap-3'}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} viewMode={viewMode} onSave={onSave} onDelete={onDelete} onAttach={onAttach} onDeleteAttachment={onDeleteAttachment} onViewAttachment={onViewAttachment} onSetReminder={onSetReminder} />
          ))}
        </div>
      )}
    </>
  )
}
