import type { ReactNode } from 'react'
import type { useTaskSort } from '../hooks/useTaskSort'
import type { DeadlineFilter, PriorityFilter, SortField, StatusFilter } from '../types/sort'

interface Props { sort: ReturnType<typeof useTaskSort>; totalTasks: number; viewMode: 'cards' | 'list'; onViewChange: (mode: 'cards' | 'list') => void; onCreate: () => void }

export function TaskToolbar({ sort, totalTasks, viewMode, onViewChange, onCreate }: Props) {
  return (
    <div className="mb-7 rounded-2xl border border-white/70 bg-white/65 p-3 shadow-[0_12px_40px_rgb(79_70_229/0.08)] backdrop-blur-xl transition-colors dark:border-slate-700/70 dark:bg-slate-900/70 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-700 dark:bg-slate-800/80" role="group" aria-label="Task view">
          <ViewButton active={viewMode === 'cards'} onClick={() => onViewChange('cards')} icon="▦">Cards</ViewButton><ViewButton active={viewMode === 'list'} onClick={() => onViewChange('list')} icon="☷">List</ViewButton>
        </div>
        <Divider />
        <Control label="Status" value={sort.status} onChange={(value) => sort.setStatus(value as StatusFilter)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></Control>
        <Control label="Priority" value={sort.priority} onChange={(value) => sort.setPriority(value as PriorityFilter)}><option value="all">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></Control>
        <Control label="Deadline" value={sort.deadline} onChange={(value) => sort.setDeadline(value as DeadlineFilter)}><option value="all">Any deadline</option><option value="overdue">Overdue</option><option value="due_soon">Next 24 hours</option><option value="scheduled">Scheduled</option><option value="none">No deadline</option></Control>
        <Divider />
        <Control label="Sort by" value={sort.field} onChange={(value) => sort.setField(value as SortField)}><option value="due_at">Due date</option><option value="priority">Priority</option><option value="status">Status</option><option value="title">Title</option><option value="created_at">Created</option><option value="updated_at">Updated</option></Control>
        <button onClick={() => sort.setDirection(sort.direction === 'asc' ? 'desc' : 'asc')} title="Reverse sort order" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" aria-label={`Sorting ${sort.direction === 'asc' ? 'ascending' : 'descending'}`}>{sort.direction === 'asc' ? '↑' : '↓'}</button>
        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{sort.sortedTasks.length} of {totalTasks}</span>
          {sort.filtersActive && <button type="button" onClick={sort.clearFilters} className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-indigo-700 hover:underline">Clear</button>}
          <button onClick={onCreate} className="group rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"><span className="mr-1.5 inline-block text-lg leading-none transition-transform group-hover:rotate-90">+</span>Create</button>
        </div>
      </div>
    </div>
  )
}

function Divider() { return <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 max-sm:hidden" /> }
function ViewButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: string; children: ReactNode }) { return <button aria-pressed={active} onClick={onClick} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${active ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}><span className="mr-1.5">{icon}</span>{children}</button> }
function Control({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="relative"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-indigo-900">{children}</select><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">▼</span></label>
}
