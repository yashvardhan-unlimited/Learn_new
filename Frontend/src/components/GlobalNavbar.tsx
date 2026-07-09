import type { AuthUser } from '../types/auth'
import asteroidUrl from '../assets/space/asteroid.webp'

type Appearance = 'light' | 'dark' | 'space'

export function GlobalNavbar({ user, onLogout, appearance, onAppearanceChange, onSettingsOpen }: { user: AuthUser; onLogout: () => void; appearance: Appearance; onAppearanceChange: (value: Appearance) => void; onSettingsOpen: () => void }) {
  const initial = user.username.trim().charAt(0).toUpperCase() || 'U'
  const nextAppearance = appearance === 'light' ? 'dark' : appearance === 'dark' ? 'space' : 'light'
  const spaceMode = appearance === 'space'
  return (
    <nav className="relative z-20 flex items-center justify-between border-b border-white/60 bg-white/75 px-5 py-3.5 shadow-[0_1px_20px_rgb(15_23_42/0.06)] backdrop-blur-xl transition-colors dark:border-slate-700/70 dark:bg-slate-950/75 sm:px-8 lg:shrink-0 lg:px-10">
      <div className="flex items-center gap-3">
        <div className={`relative grid h-11 w-11 place-items-center text-sm font-black text-white ${appearance === 'space' ? 'overflow-visible' : 'overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500 shadow-lg shadow-indigo-500/25'}`}>
          {appearance === 'space' && <img src={asteroidUrl} alt="" className="absolute h-16 w-16 max-w-none object-contain drop-shadow-[0_0_12px_rgba(129,140,248,0.7)]" />}
          <span className="relative z-10 drop-shadow-md">TA</span>{appearance !== 'space' && <span className="absolute inset-x-1 top-0 h-px bg-white/70" />}
        </div>
        <div><p className="brand-title text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Task AI</p><p className="brand-subtitle hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">{spaceMode ? 'Your productivity mission control' : 'Plan clearly. Finish confidently.'}</p></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="nav-user hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user.username}</p><p className="nav-status text-[11px] text-emerald-600"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />{spaceMode ? 'Crew online' : 'Active'}</p></div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-200 text-sm font-bold text-indigo-700 ring-2 ring-white shadow-sm" aria-hidden="true">{initial}</div>
        <button type="button" onClick={() => onAppearanceChange(nextAppearance)} title={`Switch to ${nextAppearance} theme`} aria-label={`Switch to ${nextAppearance} theme`} className="nav-control grid h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white/70 text-base shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800">{appearance === 'light' ? '☾' : appearance === 'dark' ? '✦' : '☀'}</button>
        <button type="button" onClick={onSettingsOpen} title="Settings" aria-label="Open settings" className="nav-control grid h-9 w-9 place-items-center rounded-xl border border-slate-200/80 bg-white/70 text-base text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">⚙</button>
        <button onClick={onLogout} className="nav-control rounded-xl border border-slate-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-950">Logout</button>
      </div>
    </nav>
  )
}
