// localStorage keeps the JWT when the page refreshes. Never store passwords.
const TOKEN_KEY = 'task_ai_access_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
