import type { Task } from './task'

export interface ChatMessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
  action_taken: boolean
  updated_tasks: Task[]
  redirect_url?: string | null
  confirmation_required?: boolean
  confirmation_token?: string | null
  confirmation_message?: string | null
}
