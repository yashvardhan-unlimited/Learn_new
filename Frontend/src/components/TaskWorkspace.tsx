import { useState } from 'react'
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
  onViewAttachment: (taskId: string, attachment: Attachment) => Promise<void>
  onSetReminder: (taskId: string, remove: boolean) => Promise<string>
}

export function TaskWorkspace(props: TaskWorkspaceProps) {
  const { tasks, loading, error, onCreate, onSave, onDelete, onAttach, onDeleteAttachment, onViewAttachment, onSetReminder } = props
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() =>
    localStorage.getItem('task-view-mode') === 'list' ? 'list' : 'cards',
  )

  function changeView(mode: 'cards' | 'list') {
    setViewMode(mode)
    localStorage.setItem('task-view-mode', mode)
  }
  return (
    <div className="p-5 sm:p-8 lg:min-h-0 lg:flex-1 lg:overscroll-contain lg:overflow-y-auto lg:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Task workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">My tasks</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Task view">
            <button aria-pressed={viewMode === 'cards'} onClick={() => changeView('cards')} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>▦ Cards</button>
            <button aria-pressed={viewMode === 'list'} onClick={() => changeView('list')} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>☷ List</button>
          </div>
          <button onClick={onCreate} className="group rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md active:translate-y-0 active:scale-95">
            <span className="mr-2 inline-block text-lg leading-none transition-transform group-hover:rotate-90">+</span>
            Create Task
          </button>
        </div>
      </header>
      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <TaskList tasks={tasks} viewMode={viewMode} confirmDelete loading={loading} onSave={onSave} onDelete={onDelete} onAttach={onAttach} onDeleteAttachment={onDeleteAttachment} onViewAttachment={onViewAttachment} onSetReminder={onSetReminder} />
    </div>
  )
}
