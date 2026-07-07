import type { AuthUser } from '../types/auth'

export function GlobalNavbar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const initial = user.username.trim().charAt(0).toUpperCase() || 'U'
  return (
    <nav className="relative z-20 flex items-center justify-between border-b border-white/60 bg-white/75 px-5 py-3.5 shadow-[0_1px_20px_rgb(15_23_42/0.06)] backdrop-blur-xl sm:px-8 lg:shrink-0 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-indigo-500/25">TA<span className="absolute inset-x-1 top-0 h-px bg-white/70" /></div>
        <div><p className="text-lg font-extrabold tracking-tight text-slate-900">Task AI</p><p className="hidden text-[11px] font-medium text-slate-500 sm:block">Plan clearly. Finish confidently.</p></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{user.username}</p><p className="text-[11px] text-emerald-600"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />Active</p></div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-200 text-sm font-bold text-indigo-700 ring-2 ring-white shadow-sm" aria-hidden="true">{initial}</div>
        <button onClick={onLogout} className="rounded-xl border border-slate-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95">Logout</button>
      </div>
    </nav>
  )
}
