import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { AuthForm } from './AuthForm'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { login, register } = useAuth()
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
      <AuthForm mode={mode} onSubmit={mode === 'login' ? login : register} onSwitchMode={() => setMode(mode === 'login' ? 'register' : 'login')} />
    </main>
  )
}
