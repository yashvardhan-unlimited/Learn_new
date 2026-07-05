import type { ChatMessageItem, ChatResponse } from '../types/chat'
import { apiRequest } from './client'

export function sendChatMessage(message: string, history: ChatMessageItem[], requireConfirmation = false, approvedAction?: string): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.slice(-20).map(({ role, content }) => ({ role, content })),
      require_confirmation: requireConfirmation,
      approved_action: approvedAction,
    }),
  })
}
