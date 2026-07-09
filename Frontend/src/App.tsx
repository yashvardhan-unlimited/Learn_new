import { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { GlobalNavbar } from './components/GlobalNavbar'
import { ChatPanel } from './components/ChatPanel'
import { TaskWorkspaceV2 } from './components/TaskWorkspaceV2'
import { SettingsPanel } from './components/SettingsPanel'
import { InteractiveStarfield } from './components/InteractiveStarfield'
import { useTasks } from './hooks/useTasks'
import { useTaskSort } from './hooks/useTaskSort'

// App composes feature hooks and layout components. CRUD details live in useTasks.
export default function App() {
  const { user, logout } = useAuth()
  const taskState = useTasks()
  const sort = useTaskSort(taskState.tasks)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(() => localStorage.getItem('confirm-delete') !== 'false')
  const [confirmAi, setConfirmAi] = useState(() => localStorage.getItem('confirm-ai') !== 'false')
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'space'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark' || saved === 'space') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const darkMode = appearance !== 'light'

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.classList.toggle('space', appearance === 'space')
    localStorage.setItem('theme', appearance)
  }, [appearance, darkMode])

  useEffect(() => { localStorage.setItem('confirm-delete', String(confirmDelete)) }, [confirmDelete])
  useEffect(() => { localStorage.setItem('confirm-ai', String(confirmAi)) }, [confirmAi])

  useEffect(() => {
    if (!mobileChatOpen && !settingsOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileChatOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape) }
  }, [mobileChatOpen, settingsOpen])

  return (
    <main className="app-shell min-h-screen bg-slate-50 lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-4 lg:overflow-hidden">
      {appearance === 'space' && <InteractiveStarfield />}
      <section className="relative z-10 lg:col-span-3 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
        <GlobalNavbar user={user!} onLogout={logout} appearance={appearance} onAppearanceChange={setAppearance} onSettingsOpen={() => setSettingsOpen(true)} />
        <TaskWorkspaceV2 tasks={sort.sortedTasks} sort={sort} totalTasks={taskState.tasks.length} confirmDelete={confirmDelete} appearance={appearance} loading={taskState.loading} error={taskState.error} onCreate={taskState.addDraft} onSave={taskState.saveTask} onDelete={taskState.removeTask} onAttach={taskState.attachFile} onDeleteAttachment={taskState.removeAttachment} onViewAttachment={taskState.viewFile} onSetReminder={taskState.setReminder} />
      </section>
      <ChatPanel onTasksChanged={taskState.refreshTasks} permissionRequired={confirmAi} onPermissionChange={setConfirmAi} mobileOpen={mobileChatOpen} onMobileClose={() => setMobileChatOpen(false)} />
      {!mobileChatOpen && (
        <button type="button" onClick={() => setMobileChatOpen(true)} className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:scale-95 lg:hidden" aria-label="Open AI assistant">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 text-lg" aria-hidden="true">✦</span>
          Ask AI
          <span className="absolute right-0 top-0 h-3 w-3 -translate-y-1/3 translate-x-1/3 rounded-full border-2 border-white bg-emerald-400" aria-hidden="true" />
        </button>
      )}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} appearance={appearance} onAppearanceChange={setAppearance} confirmDelete={confirmDelete} onConfirmDeleteChange={setConfirmDelete} confirmAi={confirmAi} onConfirmAiChange={setConfirmAi} />
    </main>
  )
}
