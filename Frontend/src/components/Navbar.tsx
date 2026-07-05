import type { ReactNode } from 'react'
import type { AuthUser } from '../types/auth'
import type { useTaskSort } from '../hooks/useTaskSort'
import type { DeadlineFilter, PriorityFilter, SortDirection, SortField, StatusFilter } from '../types/sort'

// Props are values a parent component passes into a child component. Callback
// props allow this child to ask App to change its state.
interface NavbarProps {
  sort: ReturnType<typeof useTaskSort>
  totalTasks: number
  user: AuthUser
  onLogout: () => void
}

// Destructuring extracts named values from the single props object.
export function Navbar({ sort, totalTasks, user, onLogout }: NavbarProps) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-8 lg:shrink-0 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">TA</div>
        <span className="text-lg font-bold tracking-tight text-slate-900">Task AI</span>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Control label="Sort" value={sort.field} onChange={(value) => sort.setField(value as SortField)}>
          <option value="due_at">Due date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="title">Title</option>
          <option value="created_at">Created</option>
          <option value="updated_at">Updated</option>
        </Control>
        <Control label="Direction" value={sort.direction} onChange={(value) => sort.setDirection(value as SortDirection)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </Control>
        <Control label="Status" value={sort.status} onChange={(value) => sort.setStatus(value as StatusFilter)}>
          <option value="all">All</option><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
        </Control>
        <Control label="Priority" value={sort.priority} onChange={(value) => sort.setPriority(value as PriorityFilter)}>
          <option value="all">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </Control>
        <Control label="Deadline" value={sort.deadline} onChange={(value) => sort.setDeadline(value as DeadlineFilter)}>
          <option value="all">All</option><option value="overdue">Overdue</option><option value="due_soon">Next 24 hours</option><option value="scheduled">Scheduled</option><option value="none">No deadline</option>
        </Control>
        <span className="self-center text-xs text-slate-500">{sort.sortedTasks.length}/{totalTasks}</span>
        {sort.filtersActive && <button type="button" onClick={sort.clearFilters} className="self-center text-xs font-semibold text-indigo-600 hover:text-indigo-800">Clear</button>}
        <span className="ml-2 hidden text-sm text-slate-500 md:inline">{user.username}</span>
        <button onClick={onLogout} className="ml-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Logout</button>
      </div>
    </nav>
  )
}

function Control({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="text-[11px] font-semibold text-slate-500">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-0.5 block rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-normal text-slate-800 outline-none focus:border-indigo-500">
        {children}
      </select>
    </label>
  )
}
