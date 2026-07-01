import type { ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { AuthPage } from './AuthPage'
import { LoadingIndicator } from '../LoadingIndicator'

// This component renders private content only after authentication succeeds.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-100"><LoadingIndicator label="Checking your session…" /></div>
  if (!user) return <AuthPage />
  return children
}
