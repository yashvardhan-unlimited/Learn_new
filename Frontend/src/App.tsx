import { useAuth } from './auth/AuthContext'
import { Navbar } from './components/Navbar'
import { SummaryPanel } from './components/SummaryPanel'
import { TaskWorkspace } from './components/TaskWorkspace'
import { useTasks } from './hooks/useTasks'
import { useTaskSort } from './hooks/useTaskSort'

// App composes feature hooks and layout components. CRUD details live in useTasks.
export default function App() {
  const { user, logout } = useAuth()
  const taskState = useTasks()
  const sort = useTaskSort(taskState.tasks)

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:h-screen lg:grid-cols-4 lg:overflow-hidden">
      <section className="lg:col-span-3 lg:flex lg:h-screen lg:min-h-0 lg:flex-col">
        <Navbar sortField={sort.field} sortDirection={sort.direction} onSortFieldChange={sort.setField} onSortDirectionChange={sort.setDirection} user={user!} onLogout={logout} />
        <TaskWorkspace tasks={sort.sortedTasks} loading={taskState.loading} error={taskState.error} onCreate={taskState.addDraft} onSave={taskState.saveTask} onDelete={taskState.removeTask} onAttach={taskState.attachFile} onDeleteAttachment={taskState.removeAttachment} onDownloadAttachment={taskState.downloadFile} />
      </section>
      <SummaryPanel />
    </main>
  )
}
