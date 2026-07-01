import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser, loginUser, registerUser } from '../api/auth'
import { UNAUTHORIZED_EVENT } from '../api/client'
import type { AuthCredentials, AuthUser } from '../types/auth'
import { clearToken, getToken, saveToken } from './token'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (credentials: AuthCredentials) => Promise<void>
  register: (credentials: AuthCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // An expired/invalid stored token is cleared by the shared API client.
    if (!getToken()) {
      setLoading(false)
      return
    }
    getCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  async function authenticate(
    request: (credentials: AuthCredentials) => ReturnType<typeof loginUser>,
    credentials: AuthCredentials,
  ) {
    const response = await request(credentials)
    saveToken(response.access_token)
    setUser(response.user)
  }

  const login = (credentials: AuthCredentials) => authenticate(loginUser, credentials)
  const register = (credentials: AuthCredentials) => authenticate(registerUser, credentials)
  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
