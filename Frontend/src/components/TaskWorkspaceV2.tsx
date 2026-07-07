import { useState } from 'react'
import type { useTaskSort } from '../hooks/useTaskSort'
import type { Attachment, TaskItem, TaskUpdate } from '../types/task'
import { TaskList } from './TaskList'
import { TaskToolbar } from './TaskToolbar'

interface Props {
  tasks: TaskItem[]; sort: ReturnType<typeof useTaskSort>; totalTasks: number; loading: boolean; error: string; onCreate: () => void
  onSave: (id: string, update: TaskUpdate) => Promise<void>; onDelete: (id: string) => Promise<void>; onAttach: (id: string, file: File) => Promise<void>
  onDeleteAttachment: (taskId: string, attachmentId: string) => Promise<void>; onViewAttachment: (taskId: string, attachment: Attachment) => Promise<void>
  onSetReminder: (taskId: string, remove: boolean) => Promise<string>
}

export function TaskWorkspaceV2(props: Props) {
  const { tasks, sort, totalTasks, loading, error, onCreate, onSave, onDelete, onAttach, onDeleteAttachment, onViewAttachment, onSetReminder } = props
  const [viewMode, setViewMode] = useState<'cards' | 'list'>(() => localStorage.getItem('task-view-mode') === 'list' ? 'list' : 'cards')
  function changeView(mode: 'cards' | 'list') { setViewMode(mode); localStorage.setItem('task-view-mode', mode) }

  return (
    <div className="relative p-5 sm:p-8 lg:min-h-0 lg:flex-1 lg:overscroll-contain lg:overflow-y-auto lg:p-10">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" /><div className="pointer-events-none absolute right-10 top-40 h-72 w-72 rounded-full bg-fuchsia-300/15 blur-3xl" />
      <header className="relative mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Task workspace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Make progress today.</h1>
        <p className="mt-2 text-sm text-slate-500">Organize priorities, meet deadlines, and keep momentum.</p>
      </header>
      <div className="relative"><TaskToolbar sort={sort} totalTasks={totalTasks} viewMode={viewMode} onViewChange={changeView} onCreate={onCreate} /></div>
      {error && <div className="relative mb-5 rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-700 shadow-sm backdrop-blur">{error}</div>}
      <div className="relative"><TaskList tasks={tasks} viewMode={viewMode} loading={loading} onSave={onSave} onDelete={onDelete} onAttach={onAttach} onDeleteAttachment={onDeleteAttachment} onViewAttachment={onViewAttachment} onSetReminder={onSetReminder} /></div>
    </div>
  )
}
