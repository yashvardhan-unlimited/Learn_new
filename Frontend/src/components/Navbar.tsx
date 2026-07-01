import type { AuthUser } from '../types/auth'
import type { SortDirection, SortField } from '../types/sort'

// Props are values a parent component passes into a child component. Callback
// props allow this child to ask App to change its state.
interface NavbarProps {
  sortField: SortField
  sortDirection: SortDirection
  onSortFieldChange: (field: SortField) => void
  onSortDirectionChange: (direction: SortDirection) => void
  user: AuthUser
  onLogout: () => void
}

// Destructuring extracts named values from the single props object.
export function Navbar({ sortField, sortDirection, onSortFieldChange, onSortDirectionChange, user, onLogout }: NavbarProps) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">TA</div>
        <span className="text-lg font-bold tracking-tight text-slate-900">Task AI</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="sort-field" className="text-sm font-medium text-slate-600">Sort by</label>
        {/* This is a controlled select: React state supplies value, and onChange
            updates that state whenever the user chooses another option. */}
        <select id="sort-field" value={sortField} onChange={(event) => onSortFieldChange(event.target.value as SortField)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
          <option value="title">Title</option>
          <option value="created_at">Created</option>
          <option value="updated_at">Updated</option>
        </select>
        <select aria-label="Sort direction" value={sortDirection} onChange={(event) => onSortDirectionChange(event.target.value as SortDirection)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <span className="ml-2 hidden text-sm text-slate-500 md:inline">{user.username}</span>
        <button onClick={onLogout} className="ml-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Logout</button>
      </div>
    </nav>
  )
}
