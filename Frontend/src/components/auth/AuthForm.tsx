import { useState, type FormEvent } from 'react'
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
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <p className="text-sm font-semibold text-indigo-600">Task AI</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Create account'}</h1>
      <p className="mt-2 text-sm text-slate-500">{isLogin ? 'Log in to manage your tasks.' : 'Register to create your private task workspace.'}</p>
      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <label className="mt-6 block text-sm font-medium text-slate-700">
        {isLogin ? 'Username or email' : 'Username'}
        <input type="text" required minLength={3} maxLength={isLogin ? 254 : 32} autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </label>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Password
        <input type="password" required minLength={isLogin ? 1 : 8} maxLength={72} autoComplete={isLogin ? 'current-password' : 'new-password'} value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
      </label>
      <button disabled={submitting} className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
        {submitting ? <LoadingIndicator label={isLogin ? 'Logging in…' : 'Registering…'} light compact /> : isLogin ? 'Log in' : 'Register'}
      </button>
      <button type="button" onClick={onSwitchMode} className="mt-4 w-full text-sm font-medium text-indigo-600 hover:text-indigo-800">
        {isLogin ? 'Need an account? Register' : 'Already registered? Log in'}
      </button>
    </form>
  )
}
