import type { AuthCredentials, AuthResponse, AuthUser } from '../types/auth'
import { apiRequest } from './client'

export function registerUser(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function loginUser(credentials: AuthCredentials): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me')
}
