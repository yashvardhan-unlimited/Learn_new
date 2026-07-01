import { clearToken, getToken } from '../auth/token'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
export const UNAUTHORIZED_EVENT = 'auth:unauthorized'

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// All protected API calls use this function, so Bearer-token behavior exists in
// one place rather than being repeated in every task/auth function.
export async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 401) {
    clearToken()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }
  return response
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await authorizedFetch(path, options)
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status)
  return response.json() as Promise<T>
}

async function errorMessage(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const data = JSON.parse(text) as { detail?: string }
    return data.detail ?? text
  } catch {
    return text || `Request failed with status ${response.status}`
  }
}
