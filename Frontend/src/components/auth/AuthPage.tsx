import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { AuthForm } from './AuthForm'
import nebulaBackground from '../../assets/space/nebula-background.webp'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { login, register } = useAuth()
  return (
    <main className="min-h-screen bg-slate-950 text-slate-900">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${nebulaBackground})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(99_102_241/0.38),transparent_28%),radial-gradient(circle_at_84%_76%,rgb(14_165_233/0.24),transparent_30%),linear-gradient(135deg,rgb(2_6_23/0.86),rgb(15_23_42/0.94))]" aria-hidden="true" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_440px] lg:px-8">
        <section className="hidden max-w-2xl text-white lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-200">Task AI</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight">
            Capture ideas, deadlines, and next steps in one focused workspace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Sign in to continue planning tasks, searching notes, reviewing summaries, and keeping your assistant in sync with your work.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <FeatureStat value="AI" label="assistant" />
            <FeatureStat value="24h" label="deadline view" />
            <FeatureStat value="Fast" label="keyword search" />
          </div>
        </section>
        <AuthForm mode={mode} onSubmit={mode === 'login' ? login : register} onSwitchMode={() => setMode(mode === 'login' ? 'register' : 'login')} />
      </div>
    </main>
  )
}

function FeatureStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/8 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-md">
      <p className="text-lg font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
    </div>
  )
}
