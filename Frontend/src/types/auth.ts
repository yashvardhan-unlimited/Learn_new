export type UserRole = 'user' | 'admin'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: 'bearer'
  user: AuthUser
}

export interface AuthCredentials {
  username: string
  password: string
}
