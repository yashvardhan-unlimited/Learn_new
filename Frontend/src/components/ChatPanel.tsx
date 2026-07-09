import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sendChatMessage } from '../api/chat'
import type { ChatMessageItem } from '../types/chat'
import { ChatMessage } from './ChatMessage'
import { LoadingIndicator } from './LoadingIndicator'
import galaxyUrl from '../assets/space/ai-galaxy.webp'

interface ChatPanelProps {
  onTasksChanged: () => Promise<void>
  mobileOpen?: boolean
  onMobileClose?: () => void
  permissionRequired: boolean
  onPermissionChange: (value: boolean) => void
}

const WELCOME_MESSAGE: ChatMessageItem = {
  id: 'welcome',
  role: 'assistant',
  content: 'I can manage tasks, search the web, create calendar events, and compose Gmail drafts.',
}

export function ChatPanel({ onTasksChanged, mobileOpen = false, onMobileClose, permissionRequired, onPermissionChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
    <>
      {mobileOpen && <button type="button" aria-label="Close AI assistant" onClick={onMobileClose} className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden" />}
      <aside role={mobileOpen ? 'dialog' : undefined} aria-modal={mobileOpen ? true : undefined} aria-label="AI task assistant" className={`chat-panel ${mobileOpen ? 'fixed inset-x-3 bottom-3 top-16 z-50 flex' : 'hidden'} min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-5 text-white shadow-2xl shadow-slate-950/40 lg:relative lg:z-10 lg:flex lg:h-full lg:min-h-0 lg:rounded-none lg:border-0 lg:p-8 lg:shadow-none`}>
      <img src={galaxyUrl} alt="" className="space-art pointer-events-none absolute right-0 top-0 h-52 w-full object-cover opacity-55 mix-blend-screen" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm">✦</span><span className="text-sm font-bold">AI Assistant</span></div>
          <button type="button" onClick={onMobileClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-lg text-slate-300 transition hover:bg-slate-700 hover:text-white" aria-label="Close assistant">×</button>
        </div>
        <div className="permission-card mb-5 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
          <div>
            <p className="text-sm font-semibold text-slate-100">Should AI take your permission? {permissionRequired ? 'On' : 'Off'}</p>
            <p className="text-xs text-slate-400">Confirm before AI tools run</p>
          </div>
          <button type="button" role="switch" aria-checked={permissionRequired} onClick={() => onPermissionChange(!permissionRequired)} className={`relative h-7 w-12 rounded-full transition-colors ${permissionRequired ? 'bg-indigo-500' : 'bg-slate-600'}`}>
            <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${permissionRequired ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">AI assistant</p>
        <h2 className="mt-2 text-2xl font-bold">Task chatbot</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Tasks, web search, Calendar events, and Gmail drafts.</p>
      </div>
      <div ref={messagesRef} aria-live="polite" className="chat-messages mt-6 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain rounded-xl border border-slate-700 bg-slate-800/60 p-4">
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
    </>
  )
}
