import { useState, type FormEvent, type ReactNode } from 'react'
import type { AuthCredentials } from '../../types/auth'
import { LoadingIndicator } from '../LoadingIndicator'

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (credentials: AuthCredentials) => Promise<void>
  onSwitchMode: () => void
}

export function AuthForm({ mode, onSubmit, onSwitchMode }: AuthFormProps) {
  const [credentials, setCredentials] = useState<AuthCredentials>({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isLogin = mode === 'login'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(credentials)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">Task AI</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{isLogin ? 'Welcome back' : 'Create account'}</h1>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-600/25" aria-hidden="true">
          T
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-100 p-1">
        <ModeButton active={isLogin} onClick={() => { if (!isLogin) onSwitchMode() }}>Log in</ModeButton>
        <ModeButton active={!isLogin} onClick={() => { if (isLogin) onSwitchMode() }}>Register</ModeButton>
      </div>
      <p className="text-sm leading-6 text-slate-500">{isLogin ? 'Access your private workspace and keep your notes, tasks, and reminders close.' : 'Start a private workspace for notes, tasks, summaries, and deadlines.'}</p>
      {error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <label className="mt-6 block text-sm font-semibold text-slate-700">
        {isLogin ? 'Username or email' : 'Username'}
        <input type="text" required minLength={3} maxLength={isLogin ? 254 : 32} autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder={isLogin ? 'you@example.com' : 'Choose a username'} />
      </label>
      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Password
        <input type="password" required minLength={isLogin ? 1 : 8} maxLength={72} autoComplete={isLogin ? 'current-password' : 'new-password'} value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'} />
      </label>
      <button disabled={submitting} className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60">
        {submitting ? <LoadingIndicator label={isLogin ? 'Logging in...' : 'Registering...'} light compact /> : isLogin ? 'Log in' : 'Create account'}
      </button>
      <p className="mt-5 text-center text-xs leading-5 text-slate-500">
        {isLogin ? 'New here?' : 'Already have an account?'}{' '}
        <button type="button" onClick={onSwitchMode} className="font-bold text-indigo-600 underline-offset-4 hover:text-indigo-800 hover:underline">
          {isLogin ? 'Create an account' : 'Log in instead'}
        </button>
      </p>
    </form>
  )
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-10 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
    >
      {children}
    </button>
  )
}
