import type { ChatMessageItem } from '../types/chat'

export function ChatMessage({ message }: { message: ChatMessageItem }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? 'rounded-br-md bg-indigo-500 text-white' : 'rounded-bl-md bg-slate-700 text-slate-100'}`}>
        {linkify(message.content)}
      </div>
    </div>
  )
}

function linkify(content: string) {
  return content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
    if (!part.startsWith('http://') && !part.startsWith('https://')) return part
    const url = part.replace(/[.,;)]+$/, '')
    const suffix = part.slice(url.length)
    return <span key={`${url}-${index}`}><a href={url} className="font-semibold text-indigo-300 underline hover:text-indigo-200">Connect Google Workspace</a>{suffix}</span>
  })
}
