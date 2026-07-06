import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sendChatMessage } from '../api/chat'
import type { ChatMessageItem } from '../types/chat'
import { ChatMessage } from './ChatMessage'
import { LoadingIndicator } from './LoadingIndicator'

interface ChatPanelProps {
  onTasksChanged: () => Promise<void>
}

const WELCOME_MESSAGE: ChatMessageItem = {
  id: 'welcome',
  role: 'assistant',
  content: 'I can manage tasks, search the web, create calendar events, and compose Gmail drafts.',
}

export function ChatPanel({ onTasksChanged }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [permissionRequired, setPermissionRequired] = useState(true)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = messagesRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const message = input.trim()
    if (!message || loading) return
    if (message.toLowerCase() === 'clear') {
      setMessages([WELCOME_MESSAGE])
      setInput('')
      setError('')
      return
    }
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: message }])
    setInput('')
    setError('')
    setLoading(true)
    try {
      const history = messages.filter((item) => item.id !== 'welcome')
      let response = await sendChatMessage(message, history, permissionRequired)
      if (response.confirmation_required && response.confirmation_token) {
        const approved = window.confirm(response.confirmation_message ?? 'Allow the AI to execute this tool?')
        if (!approved) {
          setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: 'Action cancelled. No tool was executed.' }])
          return
        }
        response = await sendChatMessage(message, history, true, response.confirmation_token)
      }
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: response.reply }])
      if (response.action_taken) await onTasksChanged()
      if (response.redirect_url) window.location.assign(response.redirect_url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to contact the assistant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="flex min-h-[520px] flex-col bg-slate-900 p-6 text-white lg:h-full lg:min-h-0 lg:overflow-hidden lg:p-8">
      <div>
        <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-100">Should AI take your permission? {permissionRequired ? 'On' : 'Off'}</p>
            <p className="text-xs text-slate-400">Confirm before AI tools run</p>
          </div>
          <button type="button" role="switch" aria-checked={permissionRequired} onClick={() => setPermissionRequired((value) => !value)} className={`relative h-7 w-12 rounded-full transition-colors ${permissionRequired ? 'bg-indigo-500' : 'bg-slate-600'}`}>
            <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${permissionRequired ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">AI assistant</p>
        <h2 className="mt-2 text-2xl font-bold">Task chatbot</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Tasks, web search, Calendar events, and Gmail drafts.</p>
      </div>
      <div ref={messagesRef} aria-live="polite" className="mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
        {loading && <LoadingIndicator label="Assistant is thinking…" light compact />}
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-950/60 p-3 text-sm text-red-200">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="chat-message">Message the task assistant</label>
        <textarea id="chat-message" rows={2} maxLength={2000} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} placeholder="Ask me to manage your tasks…" className="min-w-0 flex-1 resize-none rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400" />
        <button type="submit" disabled={loading || !input.trim()} className="self-stretch rounded-xl bg-indigo-500 px-4 text-sm font-semibold hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">Send</button>
      </form>
      <p className="mt-3 text-xs text-slate-500">Email actions create drafts only. Nothing is sent automatically.</p>
    </aside>
  )
}
