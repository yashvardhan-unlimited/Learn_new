import { useAuth } from './auth/AuthContext'
import { Navbar } from './components/Navbar'
import { ChatPanel } from './components/ChatPanel'
import { TaskWorkspace } from './components/TaskWorkspace'
import { useTasks } from './hooks/useTasks'
import { useTaskSort } from './hooks/useTaskSort'

// App composes feature hooks and layout components. CRUD details live in useTasks.
export default function App() {
  const { user, logout } = useAuth()
  const taskState = useTasks()
  const sort = useTaskSort(taskState.tasks)

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-4 lg:overflow-hidden">
      <section className="lg:col-span-3 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
        <Navbar sort={sort} totalTasks={taskState.tasks.length} user={user!} onLogout={logout} />
        <TaskWorkspace tasks={sort.sortedTasks} loading={taskState.loading} error={taskState.error} onCreate={taskState.addDraft} onSave={taskState.saveTask} onDelete={taskState.removeTask} onAttach={taskState.attachFile} onDeleteAttachment={taskState.removeAttachment} onDownloadAttachment={taskState.downloadFile} onSetReminder={taskState.setReminder} />
      </section>
      <ChatPanel onTasksChanged={taskState.refreshTasks} />
    </main>
  )
}
